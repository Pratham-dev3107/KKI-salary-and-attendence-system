/**
 * Converts HH:MM string to minutes from midnight
 */
function timeToMins(timeStr) {
  if (!timeStr) return 0;
  const parts = String(timeStr).split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

/**
 * Converts minutes from midnight to HH:MM string
 */
function minsToTime(mins) {
  if (isNaN(mins) || mins < 0) return '00:00';
  const h = Math.floor(mins / 60) % 24;
  const m = Math.floor(mins % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Calculates effective first IN time using late-arrival grace slab rule
 * @param {string} rawInTime - HH:MM
 * @param {string} shiftStart - HH:MM (default 08:30)
 * @param {number} slabMinutes - default 30
 */
function getEffectiveFirstIn(rawInTime, shiftStart = '08:30', slabMinutes = 30) {
  const inMins = timeToMins(rawInTime);
  const shiftMins = timeToMins(shiftStart);

  // Arrived early or on time -> Effective start is shift start (no early credit)
  if (inMins <= shiftMins) {
    return { effectiveTime: shiftStart, effectiveMins: shiftMins, lateMins: 0 };
  }

  // Late arrival: round UP to next slab boundary
  const lateDelta = inMins - shiftMins;
  const slabCount = Math.ceil(lateDelta / slabMinutes);
  const effectiveMins = shiftMins + (slabCount * slabMinutes);

  return {
    effectiveTime: minsToTime(effectiveMins),
    effectiveMins,
    lateMins: lateDelta,
  };
}

/**
 * Compute daily attendance, regular hours, OT hours, and status
 * @param {Array<string>} timestamps - array of HH:MM timestamps ["07:54", "12:33", "14:24", "18:36"]
 * @param {Object} settings - rule parameters
 * @param {string} weekday - "Mon", "Tue", "Sun" etc.
 * @param {Array<Object>} customRules - list of active custom rules
 */
function computeDailyAttendance(timestamps, settings = {}, weekday = '', customRules = []) {
  const shiftStart = settings.shift_start || '08:30';
  const shiftEnd = settings.shift_end || '16:30';
  const slabMinutes = parseInt(settings.grace_slab_minutes || 30, 10);
  const otRounding = settings.ot_rounding || 'minutes';
  const shortThreshold = parseFloat(settings.short_hours_threshold || 4.0);
  const weeklyOffDay = settings.weekly_off_day || 'Sun';
  const maxOtHours = parseFloat(settings.max_ot_hours || 0);
  const lunchDeductionMins = parseInt(settings.lunch_deduction_mins || 0, 10);
  const latePenaltyThresholdMins = parseInt(settings.late_penalty_threshold_mins || 120, 10);

  // No punches -> Absent
  if (!timestamps || timestamps.length === 0) {
    const isWeeklyOff = (weekday && weekday.toLowerCase().startsWith(weeklyOffDay.toLowerCase().slice(0, 3)));
    return {
      effectiveIn: '',
      effectiveOut: '',
      punchPairsFormatted: '',
      regularHours: 0,
      otHours: 0,
      totalHours: 0,
      lateMinutes: 0,
      status: isWeeklyOff ? 'Weekly Off (Paid)' : 'Absent',
    };
  }

  // Odd timestamp count -> Incomplete Needs Review
  if (timestamps.length % 2 !== 0) {
    return {
      effectiveIn: timestamps[0] || '',
      effectiveOut: timestamps[timestamps.length - 1] || '',
      punchPairsFormatted: timestamps.join(' ➔ '),
      regularHours: 0,
      otHours: 0,
      totalHours: 0,
      lateMinutes: 0,
      status: 'Incomplete',
    };
  }

  const shiftStartMins = timeToMins(shiftStart);
  const shiftEndMins = timeToMins(shiftEnd);
  const isWeeklyOff = (weekday && weekday.toLowerCase().startsWith(weeklyOffDay.toLowerCase().slice(0, 3)));

  // Span 1: apply grace slab to first IN punch
  const firstIn = timestamps[0];
  const { effectiveTime: effectiveInTime, effectiveMins: effectiveInMins, lateMins } = getEffectiveFirstIn(
    firstIn,
    shiftStart,
    slabMinutes
  );

  let totalRegularMins = 0;
  let totalOtMins = 0;
  let totalSundayOtMins = 0;
  const punchPairStrings = [];
  let maxMidDayExitMins = 0;

  // Process all (IN, OUT) pairs
  for (let i = 0; i < timestamps.length; i += 2) {
    const rawIn = timestamps[i];
    const rawOut = timestamps[i + 1];

    punchPairStrings.push(`IN ${rawIn} ➔ OUT ${rawOut}`);

    // Check mid-day exit duration between previous OUT and current IN
    if (i >= 2) {
      const prevOut = timestamps[i - 1];
      const prevOutMins = timeToMins(prevOut);
      const curInMins = timeToMins(rawIn);
      if (curInMins > prevOutMins) {
        const exitMins = curInMins - prevOutMins;
        if (exitMins > maxMidDayExitMins) maxMidDayExitMins = exitMins;
      }
    }

    const inMins = (i === 0) ? effectiveInMins : timeToMins(rawIn);
    const outMins = timeToMins(rawOut);

    if (outMins <= inMins) continue;

    // SUNDAY / WEEKLY OFF: ALL worked time = Overtime (no regular hours)
    if (isWeeklyOff) {
      const totalSpan = outMins - inMins;
      totalSundayOtMins += totalSpan;
    } else {
      // Regular window is from inMins to shiftEndMins (4:30 PM)
      const regStart = Math.max(inMins, Math.min(inMins, shiftEndMins));
      const regEnd = Math.min(outMins, shiftEndMins);
      const regSpan = Math.max(0, regEnd - regStart);

      // Overtime window is after shiftEndMins (4:30 PM)
      const otStart = Math.max(inMins, shiftEndMins);
      const otEnd = Math.max(outMins, shiftEndMins);
      const otSpan = Math.max(0, otEnd - otStart);

      totalRegularMins += regSpan;
      totalOtMins += otSpan;
    }
  }

  // For non-Sunday: Apply Lunch / Break Time Deduction if shift exceeds 5 hours (300 mins)
  if (!isWeeklyOff && lunchDeductionMins > 0 && totalRegularMins > 300) {
    totalRegularMins = Math.max(0, totalRegularMins - lunchDeductionMins);
  }

  // Apply Active Custom Rules (only for non-Sunday/non-weekly-off days)
  if (!isWeeklyOff && Array.isArray(customRules)) {
    customRules.forEach(rule => {
      if (!rule || !rule.is_active) return;

      // Mid-day Exit Rule Evaluation
      if (rule.rule_type === 'midday_exit' && maxMidDayExitMins > (rule.threshold_mins || 0)) {
        const deduct = parseInt(rule.deduction_mins || 0, 10);
        if (deduct > 0) totalRegularMins = Math.max(0, totalRegularMins - deduct);
      }

      // Late Penalty Rule Evaluation
      if (rule.rule_type === 'late_penalty' && lateMins > (rule.threshold_mins || 0)) {
        const deduct = parseInt(rule.deduction_mins || 0, 10);
        if (deduct > 0) totalRegularMins = Math.max(0, totalRegularMins - deduct);
      }
    });
  }

  // Apply OT rounding if configured as 30min_block
  if (otRounding === '30min_block') {
    totalOtMins = Math.floor(totalOtMins / 30) * 30;
    totalSundayOtMins = Math.floor(totalSundayOtMins / 30) * 30;
  }

  // Apply Max OT Cap if configured (> 0) — only for regular OT, Sunday OT is uncapped
  if (maxOtHours > 0 && (totalOtMins / 60) > maxOtHours) {
    totalOtMins = maxOtHours * 60;
  }

  // For Sunday: regularHours = 0, all time is Sunday OT
  const regularHours = isWeeklyOff ? 0 : +(totalRegularMins / 60).toFixed(2);
  const otHours = isWeeklyOff ? 0 : +(totalOtMins / 60).toFixed(2);
  const sundayOtHours = isWeeklyOff ? +(totalSundayOtMins / 60).toFixed(2) : 0;
  const totalHours = +(regularHours + otHours + sundayOtHours).toFixed(2);

  const finalOutTime = timestamps[timestamps.length - 1];

  let status = 'Present (Full)';
  if (isWeeklyOff && totalHours > 0) {
    status = 'Weekly Off (Worked OT)';
  } else if (lateMins >= latePenaltyThresholdMins || totalHours < shortThreshold) {
    status = 'Present (Short)';
  }

  return {
    effectiveIn: effectiveInTime,
    effectiveOut: finalOutTime,
    punchPairsFormatted: punchPairStrings.join(' | '),
    regularHours,
    otHours,
    sundayOtHours,
    totalHours,
    lateMinutes: lateMins,
    status,
  };
}

/**
 * Apply Sunday / Weekly-Off Forfeiture Logic to a full month of records per worker
 * ENHANCED: Multiple forfeiture rules
 * @param {Array<Object>} dailyRecords - Array of daily attendance objects sorted by date
 * @param {Object} settings
 */
function applyWeeklyOffForfeiture(dailyRecords, settings = {}) {
  const weeklyOffDay = settings.weekly_off_day || 'Sun';
  const absentThreshold = parseInt(settings.forfeiture_absent_threshold || 2, 10);
  const weeklyOffForfeiture = parseInt(settings.weekly_off_forfeiture_threshold || 3, 10);
  const monthlyAbsentForfeiture = parseInt(settings.monthly_absent_forfeiture_threshold || 4, 10);

  // Count total monthly absents
  let totalMonthlyAbsents = 0;
  dailyRecords.forEach(r => {
    if (r.status === 'Absent') totalMonthlyAbsents++;
  });

  // Step 1: Evaluate Weekly Forfeiture rules for each Sunday
  for (let i = 0; i < dailyRecords.length; i++) {
    const rec = dailyRecords[i];
    const isWeeklyOff = rec.weekday && rec.weekday.toLowerCase().startsWith(weeklyOffDay.toLowerCase().slice(0, 3));

    if (isWeeklyOff && rec.status.includes('Weekly Off')) {
      // Don't forfeit Sunday if worker worked OT that day
      if (rec.status === 'Weekly Off (Worked OT)' || (rec.sundayOtHours && rec.sundayOtHours > 0)) {
        rec.status = 'Weekly Off (Worked OT)';
        continue;
      }

      // Check weekly absent count in preceding Mon-Sat stretch
      let weeklyAbsentCount = 0;
      let weeklyOffsInWeek = 0;
      for (let j = Math.max(0, i - 6); j < i; j++) {
        const prevRec = dailyRecords[j];
        if (prevRec.status === 'Absent') {
          weeklyAbsentCount++;
          weeklyOffsInWeek++;
        } else if (prevRec.status.includes('Weekly Off')) {
          weeklyOffsInWeek++;
        }
      }

      if (weeklyAbsentCount >= absentThreshold || weeklyOffsInWeek >= weeklyOffForfeiture) {
        rec.status = 'Weekly Off (Forfeited)';
      } else {
        rec.status = 'Weekly Off (Paid)';
      }
    }
  }

  // Step 2: Monthly Forfeiture Rule (If 4+ absents in month, forfeit EXACTLY 1 non-OT Sunday)
  if (totalMonthlyAbsents >= monthlyAbsentForfeiture) {
    let forfeitedCount = dailyRecords.filter(r => r.status === 'Weekly Off (Forfeited)').length;

    // If no Sunday is forfeited yet by weekly rule, forfeit the FIRST available non-OT paid Sunday
    if (forfeitedCount === 0) {
      for (let i = 0; i < dailyRecords.length; i++) {
        const rec = dailyRecords[i];
        const isWeeklyOff = rec.weekday && rec.weekday.toLowerCase().startsWith(weeklyOffDay.toLowerCase().slice(0, 3));
        if (isWeeklyOff && rec.status === 'Weekly Off (Paid)') {
          rec.status = 'Weekly Off (Forfeited)';
          break; // Forfeit ONLY EXACTLY 1 Sunday!
        }
      }
    }
  }

  return dailyRecords;
}

module.exports = {
  timeToMins,
  minsToTime,
  getEffectiveFirstIn,
  computeDailyAttendance,
  applyWeeklyOffForfeiture,
};
