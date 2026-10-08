import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { calculateAttendanceStats, filterBookingsByStatus, sortBookingsByTime } from '../memberUtils.js';

export const useAttendanceHistory = () => {
  const token = localStorage.getItem('token');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
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
    };
    
    if (token) {
        fetchHistory();
    }
  }, []);

  const stats = useMemo(() => calculateAttendanceStats(bookings), [bookings]);
  const filteredBookings = useMemo(() => filterBookingsByStatus(bookings, filterStatus), [bookings, filterStatus]);

  return {
    loading,
    filterStatus,
    setFilterStatus,
    stats,
    filteredBookings
  };
};