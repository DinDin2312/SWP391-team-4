import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Calendar, Clock, AlertTriangle, RefreshCw,
  AlertCircle, Search, MapPin, Users, CheckCircle2
} from 'lucide-react';
import { t, useLanguage } from '../../../i18n/useLanguage';
import { REASON_CATEGORIES, getReasonLabel, formatScheduleSlot, isMakeupSession } from '../coachRescheduleUtils';

const CreateRescheduleModal = ({ isOpen, onClose, onSuccess, initialScheduleId }) => {
  const currentLang = useLanguage();
  const lang = (currentLang === 'vi' || globalThis.localStorage?.getItem('nexusLanguage') === 'vi') ? 'vi' : 'en';

  const [upcomingSchedules, setUpcomingSchedules] = useState([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchScheduleQuery, setSearchScheduleQuery] = useState('');

  // Form fields
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [isSelectingSchedule, setIsSelectingSchedule] = useState(!initialScheduleId);
  const [actionType, setActionType] = useState('MAKE_UP_SESSION');
  const [reasonCategory, setReasonCategory] = useState('UNAVAILABLE_NO_SUB');
  const [reasonNote, setReasonNote] = useState('');
  const [proposedDate, setProposedDate] = useState('');
  const [proposedStartTime, setProposedStartTime] = useState('');
  const [proposedEndTime, setProposedEndTime] = useState('');
  const [availability, setAvailability] = useState({
    checking: false,
    checked: false,
    available: true,
    hasCoachConflict: false,
    coachConflictDetail: '',
    hasRoomConflict: false,
    roomConflictDetail: '',
    suggestedSlots: []
  });

  useEffect(() => {
    if (!isOpen) {
      // Reset form
      setSelectedScheduleId('');
      setIsSelectingSchedule(false);
      setSearchScheduleQuery('');
      setActionType('MAKE_UP_SESSION');
      setReasonCategory('UNAVAILABLE_NO_SUB');
      setReasonNote('');
      setProposedDate('');
      setProposedStartTime('');
      setProposedEndTime('');
      setErrorMsg('');
      setAvailability({
        checking: false,
        checked: false,
        available: true,
        hasCoachConflict: false,
        coachConflictDetail: '',
        hasRoomConflict: false,
        roomConflictDetail: '',
        suggestedSlots: []
      });
      return;
    }

    if (initialScheduleId) {
      setSelectedScheduleId(String(initialScheduleId));
      setIsSelectingSchedule(false);
    } else {
      setIsSelectingSchedule(true);
    }

    const fetchUpcoming = async () => {
      const token = globalThis.localStorage?.getItem('token');
      if (!token) return;
      try {
        setLoadingSchedules(true);
        const res = await axios.get('http://localhost:8080/api/v1/coach/reschedule-requests/upcoming-schedules', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const list = Array.isArray(res.data) ? res.data : [];
        setUpcomingSchedules(list);
        if (initialScheduleId && list.some(s => String(s.scheduleId) === String(initialScheduleId))) {
          setSelectedScheduleId(String(initialScheduleId));
          setIsSelectingSchedule(false);
        } else if (!initialScheduleId && !selectedScheduleId) {
          setIsSelectingSchedule(true);
        }
      } catch (err) {
        console.error('Failed to load upcoming schedules', err);
        setErrorMsg(t('Failed to load upcoming schedules. Please try again.'));
      } finally {
        setLoadingSchedules(false);
      }
    };

    fetchUpcoming();
  }, [isOpen, initialScheduleId]);

  const filteredSchedules = useMemo(() => {
    if (!searchScheduleQuery.trim()) return upcomingSchedules;
    const q = searchScheduleQuery.toLowerCase().trim();
    return upcomingSchedules.filter(s => {
      const slotText = formatScheduleSlot(s.startTime, s.endTime, lang).toLowerCase();
      const name = (s.className || '').toLowerCase();
      const room = (s.roomName || '').toLowerCase();
      return name.includes(q) || room.includes(q) || slotText.includes(q);
    });
  }, [upcomingSchedules, searchScheduleQuery, lang]);

  const selectedSchedule = upcomingSchedules.find(s => String(s.scheduleId) === String(selectedScheduleId));

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Compute quick suggestions based on selected session date
  const dateSuggestions = useMemo(() => {
    if (!selectedSchedule?.startTime) return [];
    try {
      const baseDate = new Date(selectedSchedule.startTime);
      if (isNaN(baseDate.getTime())) return [];
      const suggestions = [];

      // Next day
      const nextDay = new Date(baseDate);
      nextDay.setDate(baseDate.getDate() + 1);
      const nextDayIso = nextDay.toISOString().split('T')[0];

      // Day after next (2 days)
      const dayAfter = new Date(baseDate);
      dayAfter.setDate(baseDate.getDate() + 2);
      const dayAfterIso = dayAfter.toISOString().split('T')[0];

      // Same day next week (7 days)
      const nextWeek = new Date(baseDate);
      nextWeek.setDate(baseDate.getDate() + 7);
      const nextWeekIso = nextWeek.toISOString().split('T')[0];

      suggestions.push({
        label: lang === 'vi' ? '+1 ngày' : '+1 day',
        iso: nextDayIso,
        text: nextDay.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'short', day: '2-digit', month: '2-digit' })
      });
      suggestions.push({
        label: lang === 'vi' ? '+2 ngày' : '+2 days',
        iso: dayAfterIso,
        text: dayAfter.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'short', day: '2-digit', month: '2-digit' })
      });
      suggestions.push({
        label: lang === 'vi' ? 'Tuần sau' : 'Next week',
        iso: nextWeekIso,
        text: nextWeek.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'short', day: '2-digit', month: '2-digit' })
      });

      return suggestions;
    } catch {
      return [];
    }
  }, [selectedSchedule, lang]);

  // Auto pre-fill start & end times matching selected class
  useEffect(() => {
    if (selectedSchedule) {
      if (!proposedStartTime && selectedSchedule.startTime) {
        setProposedStartTime(selectedSchedule.startTime.substring(11, 16));
      }
      if (!proposedEndTime && selectedSchedule.endTime) {
        setProposedEndTime(selectedSchedule.endTime.substring(11, 16));
      }
    }
  }, [selectedSchedule]);

  const isProposedDateInPast = useMemo(() => {
    if (!proposedDate) return false;
    try {
      const checkDateTime = new Date(`${proposedDate}T${proposedStartTime || '23:59'}:00`);
      return checkDateTime <= new Date();
    } catch {
      return false;
    }
  }, [proposedDate, proposedStartTime]);

  const humanReadableProposedDate = useMemo(() => {
    if (!proposedDate) return '';
    try {
      const d = new Date(`${proposedDate}T12:00:00`);
      if (isNaN(d.getTime())) return proposedDate;
      return d.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return proposedDate;
    }
  }, [proposedDate, lang]);

  // Real-time conflict pre-check (Debounced ~350ms)
  useEffect(() => {
    if (!isMakeupSession(actionType) || !selectedScheduleId || !proposedDate || !proposedStartTime || !proposedEndTime) {
      setAvailability({
        checking: false,
        checked: false,
        available: true,
        hasCoachConflict: false,
        coachConflictDetail: '',
        hasRoomConflict: false,
        roomConflictDetail: '',
        suggestedSlots: []
      });
      return;
    }

    if (isProposedDateInPast || proposedStartTime >= proposedEndTime) {
      return;
    }

    const timer = setTimeout(async () => {
      const token = globalThis.localStorage?.getItem('token');
      if (!token) return;

      try {
        setAvailability(prev => ({ ...prev, checking: true }));
        const res = await axios.get('http://localhost:8080/api/v1/coach/reschedule-requests/check-availability', {
          params: {
            scheduleId: parseInt(selectedScheduleId, 10),
            proposedStartTime: `${proposedDate}T${proposedStartTime}:00`,
            proposedEndTime: `${proposedDate}T${proposedEndTime}:00`,
            proposedRoomId: selectedSchedule?.roomId
          },
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = res.data || {};
        setAvailability({
          checking: false,
          checked: true,
          available: Boolean(data.available),
          hasCoachConflict: Boolean(data.hasCoachConflict),
          coachConflictDetail: data.coachConflictDetail || '',
          hasRoomConflict: Boolean(data.hasRoomConflict),
          roomConflictDetail: data.roomConflictDetail || '',
          suggestedSlots: Array.isArray(data.suggestedSlots) ? data.suggestedSlots : []
        });
      } catch (err) {
        console.error('Failed to check availability', err);
        setAvailability(prev => ({ ...prev, checking: false }));
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [actionType, selectedScheduleId, proposedDate, proposedStartTime, proposedEndTime, isProposedDateInPast, selectedSchedule]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedScheduleId) {
      setErrorMsg(t('Please select a class session to reschedule.'));
      return;
    }

    if (selectedSchedule?.hasPendingRequest) {
      setErrorMsg(t('This session already has a reschedule request pending approval (#') + selectedSchedule.existingRequestId + t('. You cannot submit duplicate requests.'));
      return;
    }

    if (isMakeupSession(actionType)) {
      if (!proposedDate || !proposedStartTime || !proposedEndTime) {
        setErrorMsg(t('Please specify proposed date, start time, and end time.'));
        return;
      }
      if (proposedStartTime >= proposedEndTime) {
        setErrorMsg(t('Proposed start time must be earlier than end time.'));
        return;
      }
      const proposedDateTime = new Date(`${proposedDate}T${proposedStartTime}:00`);
      if (proposedDateTime <= new Date()) {
        setErrorMsg(t('Proposed make-up time must be in the future. (Please check whether browser input is MM/DD or DD/MM).'));
        return;
      }
      if (availability.checked && !availability.available) {
        setErrorMsg(t('Proposed slot is conflicted. Please choose a different time or pick a suggested slot.'));
        return;
      }
    }

    const token = globalThis.localStorage?.getItem('token');
    if (!token) return;

    try {
      setSubmitting(true);
      const finalDetails = reasonNote.trim() || getReasonLabel(reasonCategory, lang);
      const payload = {
        scheduleId: parseInt(selectedScheduleId, 10),
        actionType: isMakeupSession(actionType) ? 'MAKEUP_SESSION' : actionType,
        reasonCategory,
        reasonDetails: finalDetails,
        reasonNote: finalDetails,
        proposedStartTime: isMakeupSession(actionType) && proposedDate && proposedStartTime
          ? `${proposedDate}T${proposedStartTime}:00`
          : undefined,
        proposedEndTime: isMakeupSession(actionType) && proposedDate && proposedEndTime
          ? `${proposedDate}T${proposedEndTime}:00`
          : undefined,
        proposedRoomId: isMakeupSession(actionType) && selectedSchedule ? selectedSchedule.roomId : undefined
      };

      await axios.post('http://localhost:8080/api/v1/coach/reschedule-requests', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      let respMsg = err.response?.data?.message || err.response?.data?.error || err.message;
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors) && err.response.data.errors[0]?.defaultMessage) {
        respMsg = err.response.data.errors[0].defaultMessage;
      }
      setErrorMsg(respMsg || t('Failed to submit reschedule request.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-xl rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--surface-hover)]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text)]">{t('Request Reschedule / Make-up Session')}</h3>
                <p className="text-xs text-[var(--text-muted)]">{t('Submit notice for future session (>12 hours notice required)')}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-[var(--text-muted)] hover:text-[var(--text)] p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Step 1: Select Session */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[var(--text)] uppercase tracking-wider">
                  {selectedSchedule && !isSelectingSchedule
                    ? t('1. Selected Class Session')
                    : t('1. Select Upcoming Class Session')} *
                </label>
                {(!selectedSchedule || isSelectingSchedule) && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[var(--primary)] font-medium">
                      {upcomingSchedules.length} {t('eligible sessions (>12h)')}
                    </span>
                    {selectedSchedule && (
                      <button
                        type="button"
                        onClick={() => setIsSelectingSchedule(false)}
                        className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
                      >
                        {t('Keep current class')}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {loadingSchedules ? (
                <div className="p-4 text-xs text-[var(--text-muted)] flex items-center justify-center gap-2 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)]">
                  <RefreshCw className="w-4 h-4 animate-spin text-[var(--primary)]" />
                  <span>{t('Loading upcoming teaching schedule...')}</span>
                </div>
              ) : upcomingSchedules.length === 0 ? (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs">
                  {t('No eligible upcoming sessions found (>12 hours ahead). Only future classes with >12h notice can be requested.')}
                </div>
              ) : selectedSchedule && !isSelectingSchedule ? (
                /* Compact Selected Class Card */
                <div className="p-3 rounded-xl bg-[var(--surface-hover)] border border-[var(--primary)] ring-1 ring-[var(--primary-soft)] text-xs space-y-2">
                  <div className="flex items-center justify-between pb-1.5 border-b border-[var(--border)]">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-bold text-[var(--text)] text-sm truncate">{selectedSchedule.className}</span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[var(--primary-soft)] text-[var(--primary)] shrink-0">
                        ID #{selectedSchedule.scheduleId}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsSelectingSchedule(true)}
                      className="text-xs font-semibold text-[var(--primary)] hover:underline shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>{t('Change class')}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-[var(--text-muted)] block">{t('Date & Time')}:</span>
                      <p className="font-semibold text-[var(--text)] flex items-center gap-1.5 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
                        <span>{formatScheduleSlot(selectedSchedule.startTime, selectedSchedule.endTime, lang)}</span>
                      </p>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] block">{t('Class & Room')}:</span>
                      <p className="font-semibold text-[var(--text)] flex items-center gap-1.5 mt-0.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
                        <span className="truncate">{selectedSchedule.roomName}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[11px] text-[var(--text-muted)] border-t border-[var(--border)]">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{t('Impacted Trainees')}:</span>
                    </span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                      {selectedSchedule.enrolledCount} {t('confirmed members enrolled')}
                    </strong>
                  </div>

                  {/* Anti-spam / Duplicate Warning Banner */}
                  {selectedSchedule.hasPendingRequest && (
                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-xs">{t('Request already pending!')}</p>
                        <p className="text-[11px] leading-relaxed mt-0.5 opacity-90">
                          {t('This session already has a reschedule request pending approval (#')}
                          {selectedSchedule.existingRequestId}
                          {t('. You cannot submit duplicate requests.')}
                        </p>
                      </div>
                    </div>
                  )}

                  {(selectedSchedule.status === 'RESCHEDULED' || selectedSchedule.status === 'SUBSTITUTE_ASSIGNED') && (
                    <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-700 dark:text-blue-300 text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-xs">{t('Session already processed!')}</p>
                        <p className="text-[11px] leading-relaxed mt-0.5 opacity-90">
                          {t('This session has already been rescheduled or assigned a substitute coach.')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Search & Select List */
                <div className="space-y-2">
                  {upcomingSchedules.length > 2 && (
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                      <input
                        type="text"
                        value={searchScheduleQuery}
                        onChange={(e) => setSearchScheduleQuery(e.target.value)}
                        placeholder={t('Search class name, date (e.g. 03/11), room...')}
                        className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-hidden focus:border-[var(--primary)]"
                        autoFocus
                      />
                    </div>
                  )}

                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                    {filteredSchedules.map((s) => {
                      const isSelected = String(s.scheduleId) === String(selectedScheduleId);
                      const slotLabel = formatScheduleSlot(s.startTime, s.endTime, lang);
                      const isPending = !!s.hasPendingRequest;

                      return (
                        <div
                          key={s.scheduleId}
                          onClick={() => {
                            if (!isPending) {
                              setSelectedScheduleId(String(s.scheduleId));
                              setIsSelectingSchedule(false);
                            }
                          }}
                          className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2.5 ${
                            isPending
                              ? 'opacity-60 bg-[var(--surface-hover)] border-[var(--border)] cursor-not-allowed'
                              : isSelected
                              ? 'border-[var(--primary)] bg-[var(--primary-soft)] ring-1 ring-[var(--primary)] cursor-pointer'
                              : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary-soft)] hover:bg-[var(--surface-hover)] cursor-pointer'
                          }`}
                        >
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold truncate ${isSelected ? 'text-[var(--primary)]' : 'text-[var(--text)]'}`}>
                                {s.className}
                              </span>
                              {isPending && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0">
                                  {t('Pending approval')} #{s.existingRequestId}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-[var(--text-muted)] mt-0.5">
                              <span className="flex items-center gap-1 font-semibold text-[var(--text)]">
                                <Calendar className="w-3 h-3 text-[var(--primary)]" />
                                {slotLabel}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {s.roomName}
                              </span>
                              <span className="flex items-center gap-1 text-[var(--primary)] font-medium">
                                <Users className="w-3 h-3" />
                                {s.enrolledCount} {t('trainees')}
                              </span>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {isSelected ? (
                              <CheckCircle2 className="w-5 h-5 text-[var(--primary)]" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-[var(--border)]" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Resolution Type */}
            <div>
              <label className="block text-xs font-bold text-[var(--text)] uppercase tracking-wider mb-1.5">
                {t('2. Solution Type')} *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setActionType('MAKE_UP_SESSION')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    actionType === 'MAKE_UP_SESSION'
                      ? 'border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)] font-bold'
                      : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--text-muted)]'
                  }`}
                >
                  <p className="text-xs font-bold">{t('Make-up Session (Dời ca)')}</p>
                  <p className="text-[11px] opacity-80 mt-0.5">{t('Propose new date & time for trainees')}</p>
                </button>

                <button
                  type="button"
                  onClick={() => setActionType('SUBSTITUTE_COACH')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    actionType === 'SUBSTITUTE_COACH'
                      ? 'border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)] font-bold'
                      : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--text-muted)]'
                  }`}
                >
                  <p className="text-xs font-bold">{t('Assign Substitute (HLV dạy thay)')}</p>
                  <p className="text-[11px] opacity-80 mt-0.5">{t('Request manager to assign another coach')}</p>
                </button>
              </div>
            </div>

            {/* Step 3: Reason Category */}
            <div>
              <label className="block text-xs font-bold text-[var(--text)] uppercase tracking-wider mb-1.5">
                {t('3. Reason Category')} *
              </label>
              <select
                value={reasonCategory}
                onChange={(e) => setReasonCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--text)] focus:outline-hidden focus:border-[var(--primary)] transition-colors"
              >
                {REASON_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {lang === 'vi' ? cat.labelVi : cat.labelEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Detailed Note */}
            <div>
              <label className="block text-xs font-bold text-[var(--text)] uppercase tracking-wider mb-1.5">
                {t('Additional Note / Explanation')}
              </label>
              <textarea
                rows={2}
                value={reasonNote}
                onChange={(e) => setReasonNote(e.target.value)}
                placeholder={t('Explain briefly why no other coach is available or context for manager...')}
                className="w-full px-3.5 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-hidden focus:border-[var(--primary)] transition-colors"
              />
            </div>

            {/* Step 4: Proposed Make-up Date & Time (Only for MAKE_UP_SESSION) */}
            {isMakeupSession(actionType) && (
              <div className="p-3.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[var(--primary)]" />
                    <span>{t('Proposed Make-up Slot')} *</span>
                  </p>
                  {/* Quick suggestion pills */}
                  {dateSuggestions.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-[var(--text-muted)]">{t('Quick pick:')}</span>
                      {dateSuggestions.map((sug, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setProposedDate(sug.iso)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-all cursor-pointer ${
                            proposedDate === sug.iso
                              ? 'bg-[var(--primary)] text-[color:var(--on-primary)] border-[var(--primary)]'
                              : 'bg-[var(--surface)] text-[var(--text)] border-[var(--border)] hover:border-[var(--primary)]'
                          }`}
                        >
                          {sug.label} ({sug.text})
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">
                      {t('Make-up Date')}
                    </label>
                    <input
                      type="date"
                      min={todayStr}
                      value={proposedDate}
                      onChange={(e) => setProposedDate(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg bg-[var(--surface)] border text-xs text-[var(--text)] focus:outline-hidden focus:border-[var(--primary)] ${
                        isProposedDateInPast ? 'border-rose-500' : 'border-[var(--border)]'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">
                      {t('Start Time')}
                    </label>
                    <input
                      type="time"
                      value={proposedStartTime}
                      onChange={(e) => setProposedStartTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text)] focus:outline-hidden focus:border-[var(--primary)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">
                      {t('End Time')}
                    </label>
                    <input
                      type="time"
                      value={proposedEndTime}
                      onChange={(e) => setProposedEndTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text)] focus:outline-hidden focus:border-[var(--primary)]"
                    />
                  </div>
                </div>

                {/* Live date preview & past date alert */}
                {proposedDate && (
                  <div className={`p-2.5 rounded-lg text-[11px] flex items-center justify-between gap-2 ${
                    isProposedDateInPast
                      ? 'bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400'
                      : 'bg-[var(--primary-soft)] border border-[var(--primary-soft)] text-[var(--primary)] font-semibold'
                  }`}>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {t('Make-up session:')} <strong>{humanReadableProposedDate}</strong>
                        {proposedStartTime && proposedEndTime ? ` (${proposedStartTime} - ${proposedEndTime})` : ''}
                      </span>
                    </div>
                    {isProposedDateInPast && (
                      <span className="font-bold shrink-0 flex items-center gap-1 text-rose-500">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{t('Date is in the past! (Check MM/DD vs DD/MM)')}</span>
                      </span>
                    )}
                  </div>
                )}

                {/* Live Availability Pre-Check Status */}
                {isMakeupSession(actionType) && proposedDate && proposedStartTime && proposedEndTime && !isProposedDateInPast && proposedStartTime < proposedEndTime && (
                  <div className="space-y-2">
                    {availability.checking ? (
                      <div className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text-muted)] flex items-center gap-2 animate-pulse">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-[var(--primary)]" />
                        <span>{t('Checking room and coach schedule availability...')}</span>
                      </div>
                    ) : availability.checked && availability.available ? (
                      <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <div>
                          <span className="font-bold">{t('Conflict-free slot!')}</span>
                          <span className="ml-1 opacity-90">{t('Room is vacant and you have no conflicting classes at this time.')}</span>
                        </div>
                      </div>
                    ) : availability.checked && !availability.available ? (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-700 dark:text-rose-300 space-y-2.5">
                        <div className="flex items-start gap-2.5">
                          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                          <div className="space-y-1.5 flex-1">
                            <p className="font-bold text-rose-600 dark:text-rose-400">{t('Schedule conflict detected!')}</p>
                            <div className="space-y-1 pt-0.5">
                              {availability.coachConflictDetail && (
                                <div className="flex items-start gap-2 text-[11px] leading-relaxed">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                                  <span>{availability.coachConflictDetail}</span>
                                </div>
                              )}
                              {availability.roomConflictDetail && (
                                <div className="flex items-start gap-2 text-[11px] leading-relaxed">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                                  <span>{availability.roomConflictDetail}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Suggested conflict-free slots on this day */}
                        {availability.suggestedSlots && availability.suggestedSlots.length > 0 && (
                          <div className="pt-2 border-t border-rose-500/20">
                            <p className="text-[11px] font-bold text-[var(--text)] mb-2 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                              <span>{t('Available slots for this room & you on')} {proposedDate}:</span>
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {availability.suggestedSlots.map((slot, sIdx) => (
                                <button
                                  key={sIdx}
                                  type="button"
                                  onClick={() => {
                                    setProposedStartTime(slot.startTime);
                                    setProposedEndTime(slot.endTime);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                                >
                                  <Clock className="w-3 h-3" />
                                  <span>{slot.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
              >
                {t('Cancel')}
              </button>

              <button
                type="submit"
                disabled={
                  submitting ||
                  !selectedScheduleId ||
                  upcomingSchedules.length === 0 ||
                  Boolean(selectedSchedule?.hasPendingRequest) ||
                  selectedSchedule?.status === 'RESCHEDULED' ||
                  selectedSchedule?.status === 'SUBSTITUTE_ASSIGNED' ||
                  selectedSchedule?.status === 'CANCELLED' ||
                  (isMakeupSession(actionType) && availability.checked && !availability.available)
                }
                className="px-5 py-2.5 rounded-xl bg-[var(--primary)] text-[color:var(--on-primary)] text-xs font-bold hover:brightness-105 active:scale-95 transition-all shadow-[var(--shadow)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
              >
                {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>
                  {selectedSchedule?.hasPendingRequest
                    ? t('Request Already Pending')
                    : (submitting ? t('Submitting...') : t('Submit to Manager'))}
                </span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CreateRescheduleModal;
