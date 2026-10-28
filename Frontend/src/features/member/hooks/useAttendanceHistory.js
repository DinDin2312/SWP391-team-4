import { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { calculateAttendanceStats, filterBookingsByStatus, sortBookingsByTime } from '../memberUtils.js';

export const useAttendanceHistory = () => {
  const token = localStorage.getItem('token');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:8080/api/v1/member/calendar-bookings", {
        headers: { Authorization: "Bearer " + token }
      });
      const nowTime = new Date().getTime();
      setBookings(sortBookingsByTime(res.data, nowTime));
    } catch (err) {
      console.error("Error fetching attendance history:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchHistory();
    } else {
      setLoading(false);
    }
  }, [fetchHistory, token]);

  const stats = useMemo(() => calculateAttendanceStats(bookings), [bookings]);

  const filteredBookings = useMemo(() => {
    const statusFiltered = filterBookingsByStatus(bookings, filterStatus);
    const q = searchQuery.trim().toLowerCase();
    if (!q) return statusFiltered;
    return statusFiltered.filter(b => {
      const clsName = String(b.className || '').toLowerCase();
      const coach = String(b.coachName || '').toLowerCase();
      const room = String(b.roomName || '').toLowerCase();
      const bookId = String(b.bookingId || '');
      return clsName.includes(q) || coach.includes(q) || room.includes(q) || bookId.includes(q);
    });
  }, [bookings, filterStatus, searchQuery]);

  return {
    bookings,
    loading,
    filterStatus,
    setFilterStatus,
    searchQuery,
    setSearchQuery,
    stats,
    filteredBookings,
    refreshHistory: fetchHistory
  };
};
