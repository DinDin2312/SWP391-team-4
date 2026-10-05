import { useState, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';


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
        const bookingsData = res.data;
        const nowTime = new Date().getTime();
        
        // Lớp sắp diễn ra (Tương lai): Gần nhất xếp trước (Tăng dần)
        const futureClasses = bookingsData
          .filter(b => new Date(b.startTime).getTime() >= nowTime)
          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
          
        // Lớp đã học (Quá khứ): Vừa học xong xếp trước (Giảm dần)
        const pastClasses = bookingsData
          .filter(b => new Date(b.startTime).getTime() < nowTime)
          .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
          
        setBookings([...futureClasses, ...pastClasses]);
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

  const stats = useMemo(() => {
    const presentCount = bookings.filter(b => b.attendanceStatus === "PRESENT").length;
    const absentCount = bookings.filter(b => b.attendanceStatus === "ABSENT").length;
    const totalCompleted = presentCount + absentCount;
    const attendanceRate = totalCompleted > 0 ? Math.round((presentCount / totalCompleted) * 100) : 0;
    return { presentCount, absentCount, attendanceRate };
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => 
      filterStatus === "ALL" || 
      b.attendanceStatus === filterStatus || 
      (filterStatus === "PENDING" && b.attendanceStatus !== "PRESENT" && b.attendanceStatus !== "ABSENT")
    );
  }, [bookings, filterStatus]);

  return {
    loading,
    filterStatus,
    setFilterStatus,
    stats,
    filteredBookings
  };
};