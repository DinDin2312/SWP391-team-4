/**
 * Calculate attendance statistics based on booking status.
 * @param {Array} bookings 
 * @returns {Object} { presentCount, absentCount, attendanceRate }
 */
export function calculateAttendanceStats(bookings) {
  if (!Array.isArray(bookings)) return { presentCount: 0, absentCount: 0, attendanceRate: 0 };
  
  const presentCount = bookings.filter(b => b.attendanceStatus === "PRESENT").length;
  const absentCount = bookings.filter(b => b.attendanceStatus === "ABSENT").length;
  const totalCompleted = presentCount + absentCount;
  
  const attendanceRate = totalCompleted > 0 ? Math.round((presentCount / totalCompleted) * 100) : 0;
  
  return { presentCount, absentCount, attendanceRate };
}

/**
 * Filter bookings by their attendance status.
 * @param {Array} bookings 
 * @param {String} filterStatus "ALL", "PRESENT", "ABSENT", or "PENDING"
 * @returns {Array} Filtered bookings
 */
export function filterBookingsByStatus(bookings, filterStatus) {
  if (!Array.isArray(bookings)) return [];
  
  return bookings.filter(b => {
    if (filterStatus === "ALL") return true;
    if (filterStatus === "PENDING") {
        return b.attendanceStatus !== "PRESENT" && b.attendanceStatus !== "ABSENT";
    }
    return b.attendanceStatus === filterStatus;
  });
}

/**
 * Sorts bookings so that upcoming classes appear first (soonest to latest),
 * followed by past classes (most recent to oldest).
 * @param {Array} bookingsData 
 * @param {Number} nowTime Current timestamp
 * @returns {Array}
 */
export function sortBookingsByTime(bookingsData, nowTime) {
  if (!Array.isArray(bookingsData)) return [];

  // Lớp sắp diễn ra (Tương lai): Gần nhất xếp trước (Tăng dần)
  const futureClasses = bookingsData
    .filter(b => new Date(b.startTime).getTime() >= nowTime)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    
  // Lớp đã học (Quá khứ): Vừa học xong xếp trước (Giảm dần)
  const pastClasses = bookingsData
    .filter(b => new Date(b.startTime).getTime() < nowTime)
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    
  return [...futureClasses, ...pastClasses];
}
