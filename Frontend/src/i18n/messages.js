// Source labels are explicit keys; API data, identifiers and user input are never translated.
const pairs = `
Operations feed|Hoạt động vận hành
Sessions in the next 7 days|Buổi tập trong 7 ngày tới
Revenue this month|Doanh thu tháng này
Package photo|Ảnh gói hội viên
Membership package|Gói hội viên
Undo photo change|Hoàn tác ảnh
The photo will be removed when you save changes.|Ảnh sẽ được gỡ khi bạn lưu thay đổi.
Choose either a replacement photo or removal.|Chọn thay ảnh hoặc gỡ ảnh.
Automatic scheduling|Xếp lịch tự động
This photo is shown beside the subject name in the subjects list.|Ảnh hiển thị cạnh tên bộ môn trong danh sách bộ môn.
Generate a whole teaching period, then review and confirm once.|Xếp trước cả đợt học, kiểm tra và xác nhận một lần.
Select a class|Chọn lớp học
For classes without registrations. One session per eligible day; existing schedules are additional occupied time.|Dành cho lớp chưa có người đăng ký. Mỗi ngày phù hợp xếp một buổi; hệ thống tính cả lịch đã có.
Sessions to schedule|Số buổi cần xếp
Minutes per session|Số phút mỗi buổi
First possible date|Ngày bắt đầu xếp lịch
Last possible date|Hạn cuối xếp lịch
Available weekdays|Các thứ có thể tổ chức
Available from|Giờ bắt đầu hoạt động
Available until|Giờ kết thúc hoạt động
Preferred start time|Giờ học ưu tiên
Rest between sessions (minutes)|Nghỉ giữa hai buổi (phút)
Days off / room maintenance|Ngày nghỉ / phòng bảo trì
Exclude date|Bỏ qua ngày này
Restore date {0}|Cho phép xếp lại ngày {0}
I confirm these days and hours are available for both the coach and the room, excluding the dates above.|Tôi xác nhận cả HLV và phòng đều có thể hoạt động vào các ngày, giờ này, trừ ngày nghỉ đã chọn.
The system tries your preferred time, then nearby 15-minute slots. It checks all existing coach and room schedules, including outside the visible week.|Hệ thống ưu tiên giờ mong muốn, rồi tìm giờ gần đó theo bước 15 phút. Kiểm tra cả lịch HLV và phòng ngoài tuần đang xem.
Generating plan…|Đang đề xuất lịch…
Generate preview|Đề xuất và xem trước
Proposed sessions|Lịch đề xuất
Not enough slots: {0} sessions still need scheduling. Extend the date range or availability.|Chưa đủ chỗ: còn thiếu {0} buổi. Hãy mở rộng khoảng ngày hoặc giờ hoạt động.
All sessions fit. Review the dates before confirming.|Đã xếp đủ buổi. Kiểm tra lịch trước khi xác nhận.
Session {0}|Buổi {0}
Ends at|Kết thúc lúc
Skipped days|Các ngày đã bỏ qua
Excluded date|Ngày nghỉ đã chọn
No available slot|Không có khung giờ trống
Edited dates must remain inside the rules. All sessions are checked again when saving; one conflict prevents the entire batch.|Ngày giờ đã chỉnh phải nằm trong điều kiện đã chọn. Hệ thống kiểm tra lại khi lưu; nếu một buổi trùng thì không lưu cả đợt.
Confirm schedule|Xác nhận tạo lịch
Saving…|Đang lưu…
Choose a class and confirm its availability.|Hãy chọn lớp và xác nhận ngày giờ hoạt động.
Unable to generate a plan. Please try again.|Không thể đề xuất lịch. Hãy thử lại.
{0} sessions created. Change the date range to view the full plan.|Đã tạo {0} buổi. Đổi khoảng ngày để xem toàn bộ lịch.
Complete the scheduling rules.|Hãy điền đầy đủ điều kiện xếp lịch.
Choose a future date range of at most 366 days.|Chọn khoảng ngày từ hiện tại, tối đa 366 ngày.
Invalid scheduling rules.|Điều kiện xếp lịch không hợp lệ.
The session must fit inside the confirmed availability window.|Giờ ưu tiên và thời lượng buổi học phải nằm trong giờ hoạt động đã xác nhận.
Automatic planning is only available before class registration. Manage existing sessions or make-up sessions separately.|Chỉ xếp lịch tự động trước khi có người đăng ký. Với lớp đã đăng ký, hãy quản lý buổi hiện có hoặc buổi học bù riêng.
Class assignment changed. Generate a new preview.|HLV hoặc phòng của lớp đã thay đổi. Hãy đề xuất lại lịch.
Generate a complete plan before saving.|Cần xếp đủ số buổi trước khi lưu.
Plan at most one session per day.|Mỗi ngày chỉ xếp tối đa một buổi cho đợt này.
Each session must respect the date, weekday, duration and availability rules.|Mỗi buổi phải đúng khoảng ngày, thứ, thời lượng và giờ hoạt động đã chọn.
The preview conflicts with a coach or room booking. Generate a new preview.|Lịch đề xuất bị trùng lịch HLV hoặc phòng. Hãy đề xuất lại lịch.
The subject, room, class or package will remain available.|Bộ môn, phòng, lớp học hoặc gói vẫn được giữ nguyên.
Overview|Tổng quan
Dashboard|Bảng điều khiển
Customer Dashboard|Tổng quan hội viên
Member Dashboard|Tổng quan hội viên
Staff & Permissions|Nhân sự và phân quyền
Center Operations|Vận hành trung tâm
Membership Packages|Gói hội viên
Reports|Báo cáo
System Audit Log|Nhật ký hệ thống
Center Manager|Quản lý trung tâm
Member|Hội viên
Trainer|Huấn luyện viên
Coach|Huấn luyện viên
Coaches|Huấn luyện viên
Receptionist|Lễ tân
Administrator|Quản trị viên
Admin|Quản trị viên
Staff|Nhân viên
CENTER CONTROL|QUẢN LÝ TRUNG TÂM
COACH PORTAL|CỔNG HUẤN LUYỆN VIÊN
FRONT DESK PORTAL|CỔNG LỄ TÂN
Nexus Center|Trung tâm Nexus
Nexus Sports Center|Trung tâm thể thao Nexus
Sports Center|Trung tâm thể thao
SPORTS CENTER|TRUNG TÂM THỂ THAO
SPORTS LAB|PHÒNG THỂ THAO
Member portal|Cổng hội viên
Coach portal|Cổng huấn luyện viên
Log in|Đăng nhập
Sign in|Đăng nhập
Sign up|Đăng ký
Log out|Đăng xuất
Logout|Đăng xuất
Welcome back|Chào mừng trở lại
Sign in to your account to continue.|Đăng nhập vào tài khoản để tiếp tục.
Sign in with Google|Đăng nhập bằng Google
Signing in...|Đang đăng nhập...
New to Nexus?|Bạn mới đến Nexus?
Already have an account?|Bạn đã có tài khoản?
Forgot password?|Quên mật khẩu?
Email|Email
Email Address|Địa chỉ email
Email Address *|Địa chỉ email *
Password|Mật khẩu
New Password|Mật khẩu mới
Confirm New Password|Xác nhận mật khẩu mới
Full Name|Họ và tên
Full name|Họ và tên
Full Name *|Họ và tên *
Full Legal Name|Họ và tên đầy đủ
Phone|Điện thoại
Phone Number|Số điện thoại
Phone number|Số điện thoại
Phone Number *|Số điện thoại *
Enter your email|Nhập email của bạn
Enter your password|Nhập mật khẩu của bạn
Enter your full name|Nhập họ và tên
Enter full name|Nhập họ và tên
Enter phone number|Nhập số điện thoại
Enter new email address|Nhập địa chỉ email mới
Create NEXUS Account|Tạo tài khoản NEXUS
Create Account|Tạo tài khoản
Creating Account...|Đang tạo tài khoản...
Join NEXUS|Tham gia NEXUS
Create New Password|Tạo mật khẩu mới
Send Verification Code|Gửi mã xác minh
Send Verification OTP|Gửi mã OTP xác minh
Verify Account|Xác minh tài khoản
Verify OTP|Xác minh OTP
Verify Code & Continue|Xác minh mã và tiếp tục
Verify & Change|Xác minh và thay đổi
Verifying...|Đang xác minh...
Check Your Inbox|Kiểm tra hộp thư
Check your email|Kiểm tra email
We sent a 6-digit verification code to|Chúng tôi đã gửi mã xác minh 6 chữ số đến
Enter the 6-digit code sent to|Nhập mã 6 chữ số đã gửi đến
. Enter the code below to confirm your account.|. Nhập mã bên dưới để xác nhận tài khoản.
Didn't receive the code?|Bạn chưa nhận được mã?
Resend Code|Gửi lại mã
Code expires in|Mã hết hạn sau
Code expires in:|Mã hết hạn sau:
Back to Sign In|Quay lại đăng nhập
Already verified?|Bạn đã xác minh?
Registered Email Address|Địa chỉ email đã đăng ký
Security PIN Code|Mã PIN bảo mật
Update Password & Sign In|Cập nhật mật khẩu và đăng nhập
Return to Member Sign In|Quay lại đăng nhập hội viên
Password Successfully Updated!|Đã cập nhật mật khẩu!
Your identity has been verified. Enter a strong, fresh security phrase.|Danh tính đã được xác minh. Hãy nhập mật khẩu mới đủ mạnh.
Your NEXUS account credentials have been synchronized. You can now log into your member dashboard.|Tài khoản NEXUS đã được cập nhật. Bạn có thể đăng nhập vào trang hội viên.
Minimum 8 characters|Ít nhất 8 ký tự
6–72 characters|6–72 ký tự
Continue demo as|Tiếp tục bản demo với vai trò
Secure access|Truy cập an toàn
Secure Delivery|Gửi an toàn
Security Protocol|Quy trình bảo mật
Privacy Policy|Chính sách quyền riêng tư
Terms of Service|Điều khoản dịch vụ
I accept the|Tôi đồng ý với
, safety protocols, and health liability waivers.|, quy định an toàn và điều khoản miễn trừ trách nhiệm sức khỏe.
or|hoặc
Cancel|Hủy
Back|Quay lại
Close|Đóng
Close drawer|Đóng bảng chi tiết
Close menu|Đóng menu
Open menu|Mở menu
Expand sidebar|Mở rộng thanh bên
Collapse sidebar|Thu gọn thanh bên
Refresh|Làm mới
Refresh data|Làm mới dữ liệu
Refresh List|Làm mới danh sách
Retry|Thử lại
Save Changes|Lưu thay đổi
Save changes|Lưu thay đổi
Saving...|Đang lưu...
Saving…|Đang lưu...
Saved Successfully!|Đã lưu thành công!
Changes saved.|Đã lưu thay đổi.
View|Xem
View Details|Xem chi tiết
View session|Xem buổi tập
View all|Xem tất cả
View all (|Xem tất cả (
View logs|Xem nhật ký
Details|Chi tiết
Edit|Chỉnh sửa
Delete|Xóa
Remove|Gỡ bỏ
Add|Thêm
Create|Tạo
Clear|Xóa bộ lọc
Clear All|Xóa tất cả
Clear Filters|Xóa bộ lọc
Clear filters|Xóa bộ lọc
Clear filter|Xóa bộ lọc
Filters|Bộ lọc
Filtering by:|Đang lọc theo:
Apply dates|Áp dụng ngày
From|Từ
To|Đến
to|đến
Previous|Trước
Next|Tiếp
Previous week|Tuần trước
Next week|Tuần sau
Today|Hôm nay
TODAY|HÔM NAY
Yesterday|Hôm qua
Tomorrow|Ngày mai
Week|Tuần
List|Danh sách
Group by|Nhóm theo
Mon|Thứ Hai
Tue|Thứ Ba
Wed|Thứ Tư
Thu|Thứ Năm
Fri|Thứ Sáu
Sat|Thứ Bảy
Sun|Chủ nhật
All|Tất cả
All statuses|Tất cả trạng thái
All roles|Tất cả vai trò
All subjects|Tất cả bộ môn
All coaches|Tất cả huấn luyện viên
All rooms|Tất cả phòng
All Packages|Tất cả gói
All Sessions|Tất cả buổi tập
All Account Status|Tất cả trạng thái tài khoản
All Package Status|Tất cả trạng thái gói
Active|Đang hoạt động
Inactive|Ngừng hoạt động
Suspended|Bị khóa
Scheduled|Đã lên lịch
Ongoing|Đang diễn ra
Completed|Đã hoàn thành
Cancelled|Đã hủy
Pending|Đang chờ
PENDING|ĐANG CHỜ
Confirmed|Đã xác nhận
Expired|Đã hết hạn
Enrolled|Đã đăng ký
Present|Có mặt
Absent|Vắng mặt
Not yet|Chưa điểm danh
Not Yet|Chưa điểm danh
NOT YET|CHƯA ĐIỂM DANH
Unassigned|Chưa phân công
Unknown|Không xác định
Required|Bắt buộc
Ready|Sẵn sàng
Full|Đã đầy
Popular|Phổ biến
New|Mới
NEW|MỚI
Total|Tổng số
Action|Thao tác
Actions|Thao tác
Status|Trạng thái
Role|Vai trò
Type|Loại
Time|Thời gian
Date & Time|Ngày và giờ
Time & Day|Ngày và giờ
Start|Bắt đầu
End|Kết thúc
Start Date|Ngày bắt đầu
End Date|Ngày kết thúc
Start time|Giờ bắt đầu
End time|Giờ kết thúc
Ends|Hết hạn
Price|Giá
Fee|Phí
Description|Mô tả
Duration|Thời hạn
Duration (days)|Thời hạn (ngày)
Days|Ngày
days|ngày
days left|ngày còn lại
Days Remaining|Số ngày còn lại
Day|Ngày
Class|Lớp học
Classes|Lớp học
Class name|Tên lớp
Class / subject|Lớp / bộ môn
Class & Coach|Lớp và huấn luyện viên
Class tuition|Học phí lớp
Subject|Bộ môn
Subjects|Bộ môn
Subject name|Tên bộ môn
Room|Phòng
Rooms|Phòng
Room name|Tên phòng
Coach / room|Huấn luyện viên / phòng
Capacity|Sức chứa
Capacity / session|Sức chứa / buổi
Maximum capacity|Sức chứa tối đa
Session|Buổi tập
Sessions|Buổi tập
sessions|buổi tập
classes|lớp học
trainees|học viên
members|hội viên
seats|chỗ
slots|chỗ
slots left|chỗ còn lại
spots left!|chỗ còn lại!
booked|đã đăng ký
results|kết quả
entries|bản ghi
Showing|Đang hiển thị
of|trên
Page|Trang
Sessions today|Buổi tập hôm nay
Today's schedule|Lịch hôm nay
Today’s schedule|Lịch hôm nay
Low registrations|Buổi ít đăng ký
Plans expiring soon|Gói sắp hết hạn
Needs attention now|Cần xử lý sớm
Upcoming sessions needing attention|Buổi sắp tới cần chú ý
After today · next 7 days|Sau hôm nay · 7 ngày tới
Times shown in Vietnam time|Thời gian theo múi giờ Việt Nam
Renewals to follow up today through the next 7 days|Các gói cần theo dõi gia hạn từ hôm nay đến 7 ngày tới
Recent activity · payments and plan registrations|Hoạt động gần đây · thanh toán và đăng ký gói
No active plans expire in the next 7 days.|Không có gói đang hoạt động hết hạn trong 7 ngày tới.
No recent activity.|Chưa có hoạt động gần đây.
No sessions scheduled today.|Hôm nay chưa có buổi tập.
No more sessions today.|Hôm nay không còn buổi tập.
Nothing needs attention after today in the next 7 days.|Không có buổi cần chú ý sau hôm nay trong 7 ngày tới.
View schedules →|Xem lịch →
View or create schedules →|Xem hoặc tạo lịch →
Cancel session|Hủy buổi tập
Cancel session?|Hủy buổi tập?
Change time|Đổi giờ
Complete|Hoàn thành
All bookings for this session will be cancelled and members will receive a notification. The session cannot be reopened. This action does not issue a refund; contact reception about tuition.|Mọi đăng ký của buổi tập này sẽ bị hủy và hội viên sẽ nhận thông báo. Buổi tập không thể mở lại. Thao tác này không hoàn tiền; hãy liên hệ lễ tân về học phí.
Roster · read only|Danh sách học viên · chỉ xem
Only the assigned coach can record attendance. Pending bookings hold a seat.|Chỉ huấn luyện viên được phân công mới có thể điểm danh. Đăng ký đang chờ vẫn giữ chỗ.
No bookings for this session.|Chưa có đăng ký cho buổi tập này.
Loading roster…|Đang tải danh sách học viên...
Create session|Tạo buổi tập
Create class|Tạo lớp học
Create series|Tạo chuỗi buổi tập
Add subject|Thêm bộ môn
Add room|Thêm phòng
Catalog|Danh mục
Schedules|Lịch tập
Operations sections|Các mục vận hành
Schedule view|Chế độ xem lịch
Return to this week|Về tuần này
Sessions in range|Buổi tập trong khoảng
Seat occupancy|Tỷ lệ đăng ký
Class performance|Hiệu quả lớp học
Bookings / total session capacity|Đăng ký / tổng số chỗ
Repeat weekly|Lặp lại mỗi tuần
Repeat sessions|Lặp lại buổi tập
Interval (weeks)|Khoảng cách (tuần)
Total sessions (including the first)|Tổng số buổi (gồm buổi đầu)
Same weekday and time. Last start date:|Cùng thứ và giờ. Ngày bắt đầu cuối:
No matching results|Không có kết quả phù hợp
No classes found|Không tìm thấy lớp học
No sessions scheduled|Chưa có buổi tập
Loading Center Operations|Đang tải trang vận hành
Loading overview|Đang tải tổng quan
Loading Nexus...|Đang tải Nexus...
Loading...|Đang tải...
Loading…|Đang tải...
Loading data...|Đang tải dữ liệu...
Loading module...|Đang tải nội dung...
Loading members...|Đang tải hội viên...
Loading history...|Đang tải lịch sử...
Loading your cart...|Đang tải giỏ hàng...
Loading your packages...|Đang tải gói của bạn...
Loading membership packages...|Đang tải gói hội viên...
Loading available courses...|Đang tải khóa học...
Loading upcoming classes...|Đang tải lớp sắp tới...
Loading class schedules...|Đang tải lịch lớp học...
Loading course enrolments...|Đang tải đăng ký khóa học...
Loading assigned trainees...|Đang tải học viên...
Loading Billing History...|Đang tải lịch sử thanh toán...
Loading Notifications...|Đang tải thông báo...
Loading Profile...|Đang tải hồ sơ...
My Schedule|Lịch của tôi
My Packages|Gói của tôi
Memberships|Gói hội viên
Book a Class|Đăng ký lớp học
Book Courses|Đăng ký khóa học
Book New Session|Đăng ký buổi mới
Book Session|Đăng ký buổi tập
Book PT Session|Đăng ký tập cá nhân
Package Store|Cửa hàng gói
NEXUS Package Store|Cửa hàng gói NEXUS
Billing & Invoices|Thanh toán và hóa đơn
Billing History|Lịch sử thanh toán
Attendance History|Lịch sử điểm danh
Attendance|Điểm danh
Attendance Rate|Tỷ lệ tham gia
Attendance Summary|Tổng kết điểm danh
Present Sessions|Buổi có mặt
Absent Sessions|Buổi vắng mặt
Total Sessions|Tổng số buổi
Notifications|Thông báo
Settings|Cài đặt
Personal Profile|Hồ sơ cá nhân
Personal Details|Thông tin cá nhân
Identity|Danh tính
Contact Information|Thông tin liên hệ
Contact Info|Thông tin liên hệ
Contact Details|Thông tin liên hệ
Contact details|Thông tin liên hệ
Contact information and account identifier|Thông tin liên hệ và mã tài khoản
Contact|Liên hệ
Account UID|Mã tài khoản
Account Status|Trạng thái tài khoản
Account Information|Thông tin tài khoản
Account actions|Thao tác tài khoản
Copy UID|Sao chép mã tài khoản
Copy password|Sao chép mật khẩu
Permissions|Quyền truy cập
Plan history|Lịch sử gói
Membership and access history|Lịch sử hội viên và quyền truy cập
Recent activity|Hoạt động gần đây
Latest events for this account|Sự kiện gần đây của tài khoản
Add Account|Thêm tài khoản
Add new account|Thêm tài khoản mới
Edit account|Chỉnh sửa tài khoản
New this month|Mới trong tháng
Total Members|Tổng hội viên
Active Accounts|Tài khoản đang hoạt động
Reset password|Đặt lại mật khẩu
Reset password?|Đặt lại mật khẩu?
Reset Account Password|Đặt lại mật khẩu tài khoản
Force password change on first login|Yêu cầu đổi mật khẩu khi đăng nhập lần đầu
Generate|Tạo ngẫu nhiên
Generate 12-character password|Tạo mật khẩu 12 ký tự
Lock|Khóa
Unlock|Mở khóa
Delete selected accounts?|Xóa các tài khoản đã chọn?
No phone|Chưa có số điện thoại
No plan|Chưa có gói
Phone number|Số điện thoại
Name, email, or phone number|Tên, email hoặc số điện thoại
Rows per page|Số hàng mỗi trang
Previous page|Trang trước
Next page|Trang sau
Joined|Ngày tham gia
Last login|Đăng nhập gần nhất
Current plan|Gói hiện tại
Select all users on this page|Chọn mọi tài khoản trên trang này
Search accounts|Tìm tài khoản
Open actions|Mở thao tác
Upload photo|Tải ảnh lên
Upload new photo|Tải ảnh mới
Change photo|Đổi ảnh
Change Email|Đổi email
Change email|Đổi email
Update Email|Cập nhật email
Email Updated!|Đã cập nhật email!
Your profile has been updated.|Hồ sơ đã được cập nhật.
Your profile data is encrypted.|Dữ liệu hồ sơ được mã hóa.
Manage your core identity|Quản lý thông tin cá nhân
Linked Email Address|Địa chỉ email liên kết
Sports Interests & Notes|Sở thích thể thao và ghi chú
Notes / Bio|Ghi chú / Giới thiệu
Notes / Sports Interests (Optional)|Ghi chú / Sở thích thể thao (không bắt buộc)
Primary Athletic Focus|Mục tiêu thể thao chính
Default Password *|Mật khẩu mặc định *
Create initial password for member|Tạo mật khẩu ban đầu cho hội viên
New member account created successfully!|Đã tạo tài khoản hội viên!
Front Desk|Lễ tân
Front Desk Receptionist|Nhân viên lễ tân
Register New Member|Đăng ký hội viên mới
Member Search & Directory|Tìm kiếm và danh bạ hội viên
Search & View Member Information|Tìm và xem thông tin hội viên
Search & View Members|Tìm và xem hội viên
Course & Membership Renewal|Gia hạn khóa học và gói hội viên
Packages & Renewals|Gói và gia hạn
Back to Member Search|Quay lại tìm hội viên
No Member Selected|Chưa chọn hội viên
No members found|Không tìm thấy hội viên
No active members found.|Không tìm thấy hội viên đang hoạt động.
Click any row to view complete member profile|Bấm vào hàng để xem hồ sơ hội viên
Click to copy phone number|Bấm để sao chép số điện thoại
Current Package|Gói hiện tại
Currently Active Package|Gói đang hoạt động
Package History|Lịch sử gói
Past Packages|Gói trước đây
Package Name|Tên gói
Package name|Tên gói
Package type|Loại gói
Package Status|Trạng thái gói
Membership Package|Gói hội viên
Membership Fee|Phí hội viên
Active Package|Gói đang hoạt động
Active Packages|Gói đang hoạt động
Expired Packages|Gói đã hết hạn
No Active Package|Chưa có gói đang hoạt động
No Active Packages|Chưa có gói đang hoạt động
No Package Enrolled|Chưa đăng ký gói
No package history found for this member.|Hội viên chưa có lịch sử gói.
No course bookings found for this member.|Hội viên chưa đăng ký khóa học.
No packages available for this category.|Danh mục này chưa có gói.
Expired / None|Hết hạn / Không có
Expired on|Hết hạn ngày
Expired since|Đã hết hạn từ
Expires on:|Hết hạn ngày:
Valid till:|Có hiệu lực đến:
Valid for|Có hiệu lực trong
Validity Duration|Thời hạn hiệu lực
Validity & Days|Hiệu lực và số ngày
Activation Date|Ngày kích hoạt
Renew Course|Gia hạn khóa học
Confirm Next Course Renewal|Xác nhận gia hạn khóa tiếp theo
Confirm & Enroll|Xác nhận và đăng ký
Enroll Next Recurring Course|Đăng ký khóa tiếp theo
Enroll Now|Đăng ký ngay
Enrolling...|Đang đăng ký...
Course|Khóa học
Course Name|Tên khóa học
Course Fee|Học phí
Course Policy|Quy định khóa học
Course Timeline|Tiến trình khóa học
First Session|Buổi đầu tiên
Next Session:|Buổi tiếp theo:
Next Session Starts:|Buổi tiếp theo bắt đầu:
Full Package Enrollment|Đăng ký toàn bộ gói
Enrolled Classes|Lớp đã đăng ký
Enrolled Courses (|Khóa đã đăng ký (
Course Enrolled|Khóa đã đăng ký
Cancel Class Registration|Hủy đăng ký lớp
Are you sure you want to cancel this class? All future sessions of this class will be dropped from your schedule. This action cannot be undone.|Bạn muốn hủy đăng ký lớp này? Mọi buổi sắp tới của lớp sẽ bị xóa khỏi lịch của bạn. Không thể hoàn tác thao tác này.
If any session conflicts with an existing schedule, the entire series will be cancelled.|Nếu một buổi trùng lịch hiện có, toàn bộ chuỗi đăng ký sẽ bị hủy.
Enrolling in a course automatically secures your spot for all scheduled sessions.|Đăng ký khóa học sẽ giữ chỗ cho bạn trong mọi buổi đã lên lịch.
All sessions synced to your schedule.|Mọi buổi tập đã được thêm vào lịch của bạn.
No courses found starting on this date.|Không có khóa học bắt đầu vào ngày này.
This member has no past or current course enrolments.|Hội viên chưa có đăng ký khóa học trước đây hoặc hiện tại.
Select a member from the left list to review their classes and process renewal.|Chọn hội viên từ danh sách bên trái để xem lớp và gia hạn.
Teaching Management|Quản lý giảng dạy
Teaching Schedule|Lịch giảng dạy
Teaching Agenda|Lịch giảng dạy
Coach Command Center|Trung tâm quản lý huấn luyện
Coach Schedule & Trainee Enrolment|Lịch huấn luyện và đăng ký học viên
Assigned Classes|Lớp được phân công
Assigned Trainees|Học viên được phân công
Assigned Trainees List|Danh sách học viên được phân công
Trainee|Học viên
Trainees|Học viên
Trainee Roster|Danh sách học viên
Total Assigned Trainees|Tổng học viên được phân công
Total Trainees Enrolled|Tổng học viên đăng ký
Total Classes|Tổng lớp học
Total Enrolled Classes|Tổng lớp đăng ký
Active Classes Taught|Lớp đang giảng dạy
Students Enrolled|Học viên đăng ký
Enrolled Trainees|Học viên đăng ký
Enrolled Classes Taught By You|Lớp đã đăng ký do bạn giảng dạy
Class Trainee Roster & Attendance|Danh sách học viên và điểm danh
Course Schedule & Attendance Records|Lịch học và hồ sơ điểm danh
View Teaching Schedule|Xem lịch giảng dạy
No Trainee Records Found|Không có hồ sơ học viên
No trainees found|Không tìm thấy học viên
No trainees matched your current search criteria|Không có học viên phù hợp với điều kiện tìm kiếm
No registered trainees or search query doesn't match|Chưa có học viên đăng ký hoặc không khớp tìm kiếm
No trainees registered for this session yet|Buổi này chưa có học viên đăng ký
No teaching sessions on this date|Ngày này chưa có buổi giảng dạy
Save Attendance|Lưu điểm danh
Attendance:|Điểm danh:
Booked Sessions|Buổi đã đăng ký
Class bookings|Đăng ký lớp học
Class Bookings|Đăng ký lớp học
Bookings|Đăng ký
Total Session Registrations|Tổng đăng ký buổi tập
Classes Attended|Lớp đã tham gia
Upcoming Classes|Lớp sắp tới
Upcoming Schedule|Lịch sắp tới
Weekly Class Schedule|Lịch lớp hằng tuần
Weekly schedule by resource|Lịch tuần theo nguồn lực
Nexus Sports Calendar|Lịch thể thao Nexus
View Full Calendar|Xem toàn bộ lịch
View all schedule|Xem toàn bộ lịch
Go to My Schedule|Đến lịch của tôi
Browse Courses|Xem khóa học
Explore Classes|Khám phá lớp học
Check schedule below|Xem lịch bên dưới
No upcoming classes scheduled.|Chưa có lớp sắp tới.
No schedules available right now.|Hiện chưa có lịch tập.
No attendance records found matching your filter.|Không có bản ghi điểm danh phù hợp với bộ lọc.
Your attendance history and participation rate.|Lịch sử điểm danh và tỷ lệ tham gia của bạn.
Mark all as read|Đánh dấu tất cả đã đọc
Mark as read|Đánh dấu đã đọc
Delete notification|Xóa thông báo
No notifications yet|Chưa có thông báo
When you get updates, they'll show up here.|Thông tin cập nhật sẽ xuất hiện tại đây.
Stay updated on your schedule, payments, and system alerts.|Theo dõi lịch tập, thanh toán và thông báo hệ thống.
Payment Date|Ngày thanh toán
Payment Method|Phương thức thanh toán
Transaction ID|Mã giao dịch
Total Amount|Tổng tiền
Subtotal|Tạm tính
Subtotal:|Tạm tính:
Discount|Giảm giá
Tax (0%)|Thuế (0%)
Order Summary|Tổng kết đơn hàng
Purchased Items|Các mục đã mua
No invoices found|Không tìm thấy hóa đơn
No detailed items found for this invoice.|Hóa đơn chưa có mục chi tiết.
You haven't made any purchases yet.|Bạn chưa có giao dịch mua hàng.
View your purchase history, membership payments, and class bookings.|Xem lịch sử mua hàng, thanh toán gói và đăng ký lớp.
View Cart|Xem giỏ hàng
Add to Cart|Thêm vào giỏ
Added to Cart|Đã thêm vào giỏ
Your cart is empty|Giỏ hàng của bạn đang trống
Cart Items (|Mục trong giỏ (
Cart Vault|Giỏ hàng
Checkout Cart|Giỏ thanh toán
Checkout|Thanh toán
Back to Cart|Quay lại giỏ hàng
Proceed to Checkout|Tiến hành thanh toán
Confirm & Pay Now|Xác nhận và thanh toán
Processing Payment|Đang xử lý thanh toán
Processing...|Đang xử lý...
Payment Successful!|Thanh toán thành công!
Payment Failed|Thanh toán thất bại
Please do not close this window|Vui lòng không đóng cửa sổ này
Please do not close this window...|Vui lòng không đóng cửa sổ này...
Connecting to VNPay Gateway...|Đang kết nối cổng VNPay...
Opening Momo App...|Đang mở ứng dụng Momo...
Verifying Credit Card Details...|Đang xác minh thông tin thẻ...
Credit Card|Thẻ tín dụng
Proceed to Member Portal|Đến cổng hội viên
Review your pending courses and complete the payment to secure your spots.|Kiểm tra các khóa đang chờ và thanh toán để giữ chỗ.
Gym Access|Quyền vào phòng gym
Gym access|Quyền vào phòng gym
AI Access|Quyền sử dụng AI
AI access|Quyền sử dụng AI
Combo (Gym + AI)|Combo (Gym + AI)
Select Combo Package|Chọn gói Combo
Subscribe Combo Package|Đăng ký gói Combo
+ Subscribe Combo Package|+ Đăng ký gói Combo
Confirm Subscription|Xác nhận đăng ký
Subscribing...|Đang đăng ký...
Price: Low to High|Giá: Thấp đến cao
Price: High to Low|Giá: Cao đến thấp
SORT:|SẮP XẾP:
STORE CURRENCY:|ĐƠN VỊ TIỀN:
Included Privileges|Quyền lợi đi kèm
Features|Tính năng
Pricing|Bảng giá
Most Popular|Phổ biến nhất
MOST POPULAR|PHỔ BIẾN NHẤT
Monthly Cycle|Chu kỳ tháng
Instant Access|Truy cập ngay
Premium|Cao cấp
Premium Training Programs|Chương trình huấn luyện cao cấp
Modern Equipment|Trang thiết bị hiện đại
Group Classes|Lớp tập nhóm
Smart Courts|Sân thông minh
Performance Lab|Phòng hiệu suất thể thao
What Our Athletes Say|Cảm nhận của hội viên
Choose the perfect plan to unlock your potential. No hidden fees.|Chọn gói phù hợp để phát huy tiềm năng. Không có phí ẩn.
Discover our signature classes designed for maximum results.|Khám phá các lớp đặc trưng được thiết kế để đạt hiệu quả tối đa.
One intelligent space for every athlete, coach, and team.|Không gian thông minh dành cho mọi hội viên, huấn luyện viên và đội nhóm.
Get Started|Bắt đầu
Join the Elite Now|Tham gia ngay
Book Facility Tour|Đăng ký tham quan
Corporate Inquiry|Liên hệ doanh nghiệp
MOVE WITH PURPOSE|VẬN ĐỘNG CÓ MỤC TIÊU
Performance, connected|Kết nối hiệu suất
Redefining|Định nghĩa lại
Athletic Command.|Quản lý thể thao.
Management.|Quản lý.
Unleash Your|Phát huy
Potential|tiềm năng của bạn
Need assistance?|Bạn cần hỗ trợ?
Questions? Contact Nexus Support at Desk 1.|Bạn có thắc mắc? Liên hệ hỗ trợ Nexus tại quầy 1.
2026 Nexus Sports Lab. All rights reserved.|2026 Nexus Sports Lab. Bảo lưu mọi quyền.
Ask NEXUS AI|Hỏi NEXUS AI
Ask anything...|Nhập câu hỏi...
NEXUS AI can make mistakes. Verify before buying.|NEXUS AI có thể sai. Hãy kiểm tra trước khi mua.
Minimize (Keep history)|Thu nhỏ (giữ lịch sử)
Close (Clear history)|Đóng (xóa lịch sử)
Export CSV|Xuất CSV
Revenue|Doanh thu
Revenue trend|Xu hướng doanh thu
Daily revenue|Doanh thu theo ngày
Successful transactions|Giao dịch thành công
Pending invoices|Hóa đơn đang chờ
Actor|Người thực hiện
Entity|Đối tượng
No administrative activity recorded yet.|Chưa có hoạt động quản trị được ghi nhận.
Manage account access, roles, and status in one place.|Quản lý quyền truy cập, vai trò và trạng thái tài khoản tại một nơi.
Manage membership plans, pricing, and availability.|Quản lý gói hội viên, giá và tình trạng cung cấp.
Plan the week, manage classes and keep resources coordinated.|Lên lịch tuần, quản lý lớp và phối hợp nguồn lực.
Review administrative changes and account activity.|Xem các thay đổi quản trị và hoạt động tài khoản.
Review financial and operational performance by date range.|Xem hiệu quả tài chính và vận hành theo khoảng ngày.
Monitor center performance and recent operational activity.|Theo dõi hiệu quả trung tâm và hoạt động vận hành gần đây.
Add Package|Thêm gói
No matching data available.|Không có dữ liệu phù hợp.
Search classes|Tìm lớp học
Search class, subject, coach or room…|Tìm lớp, bộ môn, huấn luyện viên hoặc phòng...
Search classes, trainers...|Tìm lớp, huấn luyện viên...
Search facility, date...|Tìm cơ sở, ngày...
Search member name / phone...|Tìm tên / số điện thoại hội viên...
Search by Member Name, Phone (09xx), Email or ID (#MEM)...|Tìm theo tên, điện thoại (09xx), email hoặc mã (#MEM)...
Search trainees by name, email, phone...|Tìm học viên theo tên, email, điện thoại...
Select a class|Chọn lớp
Select a coach|Chọn huấn luyện viên
Select a role|Chọn vai trò
Select a room|Chọn phòng
Select a subject|Chọn bộ môn
Searching member records...|Đang tìm hồ sơ hội viên...
Breadcrumb|Đường dẫn điều hướng
PNG or JPEG · max 2 MB|PNG hoặc JPEG · tối đa 2 MB
Use at most 10,000 characters.|Tối đa 10.000 ký tự.
No active class matches. Create or activate a class with the required resource first.|Không có lớp đang hoạt động phù hợp. Hãy tạo hoặc kích hoạt lớp có nguồn lực cần thiết.
Add a resource and assign an active class to start scheduling.|Thêm nguồn lực và phân công lớp đang hoạt động để bắt đầu lên lịch.
Add a room with its capacity, then assign a class.|Thêm phòng và sức chứa, sau đó phân công lớp.
Add a subject before creating a class.|Thêm bộ môn trước khi tạo lớp.
Create a class or adjust the search and status filter.|Tạo lớp hoặc điều chỉnh tìm kiếm và bộ lọc trạng thái.
Adjust your filters or create a session for this date range.|Điều chỉnh bộ lọc hoặc tạo buổi tập trong khoảng ngày này.
Overview is unavailable. Use Retry above to load the latest information.|Không tải được tổng quan. Bấm Thử lại phía trên để tải dữ liệu mới nhất.
Operations data could not be loaded. Retry using the error message above.|Không tải được dữ liệu vận hành. Hãy thử lại từ thông báo lỗi phía trên.
The start date must be before the end date.|Ngày bắt đầu phải trước ngày kết thúc.
Non-cancelled sessions starting today within the current filters.|Buổi không bị hủy bắt đầu hôm nay theo bộ lọc hiện tại.
Scheduled and completed sessions within the current filters.|Buổi đã lên lịch và đã hoàn thành theo bộ lọc hiện tại.
Scheduled sessions with less than 25% of seats booked. Completed and cancelled sessions are excluded.|Buổi đã lên lịch có dưới 25% chỗ được đăng ký. Không tính buổi hoàn thành hoặc bị hủy.
Highest confirmed + pending booking count of any non-cancelled session.|Số đăng ký đã xác nhận và đang chờ cao nhất trong một buổi không bị hủy.
Low registrations · upcoming scheduled sessions below 25% capacity|Buổi ít đăng ký · buổi sắp tới có dưới 25% sức chứa
Today’s sessions · cancellations excluded|Buổi hôm nay · không tính buổi bị hủy
Completed and cancelled sessions cannot be edited or reopened.|Buổi đã hoàn thành hoặc bị hủy không thể chỉnh sửa hay mở lại.
This ended session will be marked completed and can no longer be edited.|Buổi đã kết thúc này sẽ được đánh dấu hoàn thành và không thể chỉnh sửa nữa.
Moving the session sends a notification to its booked members. The backend also checks their timetable.|Đổi lịch sẽ gửi thông báo cho hội viên đã đăng ký. Hệ thống cũng kiểm tra lịch của họ.
Cancelling a session will cancel its bookings and send notifications. Fees must be reconciled separately by reception; the system does not issue automatic refunds.|Hủy buổi tập sẽ hủy đăng ký và gửi thông báo. Lễ tân cần xử lý học phí riêng; hệ thống không tự hoàn tiền.
Changing a class’s room, coach or capacity affects all its sessions.|Đổi phòng, huấn luyện viên hoặc sức chứa của lớp sẽ ảnh hưởng mọi buổi của lớp.
A class owns its coach, room and capacity for every session. Classes with future sessions cannot be deactivated; cancel those sessions first.|Mỗi lớp quy định huấn luyện viên, phòng và sức chứa cho mọi buổi. Không thể ngừng lớp còn buổi sắp tới; hãy hủy các buổi đó trước.
Existing class members are not automatically booked into newly created sessions. One conflict rejects the entire series.|Hội viên hiện tại không tự được đăng ký vào buổi mới. Một xung đột sẽ khiến toàn bộ chuỗi bị từ chối.
The backend will reject this change if the class has any future sessions. Cancel them first. Room and coach assignments are kept.|Hệ thống sẽ từ chối nếu lớp còn buổi sắp tới. Hãy hủy trước. Phân công phòng và huấn luyện viên được giữ nguyên.
Seat counts include confirmed bookings and pending holds. Colours identify subjects; “Ongoing” is derived from time. Select a session to view its roster or change its time.|Số chỗ gồm đăng ký đã xác nhận và đang chờ. Màu phân biệt bộ môn; trạng thái đang diễn ra dựa theo giờ. Chọn buổi để xem học viên hoặc đổi giờ.
Sessions are stacked in time order to keep dense schedules readable. Empty cells start at 09:00; choose the exact time in the drawer. Room and coach come from the selected class.|Các buổi xếp theo giờ để lịch dễ đọc. Ô trống bắt đầu lúc 09:00; chọn giờ chính xác trong bảng chi tiết. Phòng và huấn luyện viên theo lớp đã chọn.
You don't have any active packages or memberships right now. Head over to the Package Store to explore our options.|Bạn hiện chưa có gói đang hoạt động. Đến cửa hàng gói để xem lựa chọn.
Looks like you haven't enrolled in any courses yet.|Bạn chưa đăng ký khóa học nào.
No recent activities found. Start booking classes to see your logs!|Chưa có hoạt động gần đây. Đăng ký lớp để xem lịch sử!
Please purchase an AI package in the Package Store to unlock this feature.|Hãy mua gói AI trong cửa hàng để mở tính năng này.
Success!|Thành công!
Error!|Có lỗi!
Info|Thông tin
Logged in as:|Đăng nhập với:
Logging you out for security...|Đang đăng xuất để bảo mật...
Sending...|Đang gửi...
Registering...|Đang đăng ký...
Working…|Đang xử lý...
per class registration|mỗi lần đăng ký lớp
min/session|phút/buổi
recorded sessions|buổi được ghi nhận
verified packages|gói đã xác nhận
items selected|mục được chọn
Low registrations in the next|Buổi ít đăng ký trong
hours.|giờ tới.
Now ·|Hiện tại ·
 · Low| · Ít đăng ký
· Full|· Đã đầy
· Near full|· Gần đầy
● Active|● Đang hoạt động
● Inactive|● Ngừng hoạt động
⚪ No Package|⚪ Chưa có gói
🔴 Expired Package|🔴 Gói hết hạn
🟢 Active Package|🟢 Gói đang hoạt động
`;
export const translations = Object.fromEntries(pairs.trim().split('\n').map(line => { const split = line.indexOf('|'); const en=line.slice(0,split),vi=line.slice(split+1); return [en,[en,vi]]; }));
const extra = `
". Please try other filters.|". Hãy thử bộ lọc khác.
(15% Member Rebate Calculated)|(Đã tính giảm giá hội viên 15%)
+21% vs last month|+21% so với tháng trước
/ class|/ lớp
09:00 · Session|09:00 · Buổi tập
10% Off all purchases|Giảm 10% mọi giao dịch
15% Off all purchases|Giảm 15% mọi giao dịch
5% Off all purchases|Giảm 5% mọi giao dịch
256-Bit Encrypted Dynamic OTP Verification|Xác minh OTP động mã hóa 256 bit
256-Bit SSL Encrypted Checkout|Thanh toán mã hóa SSL 256 bit
256-Bit SSL Encrypted Protocol|Giao thức mã hóa SSL 256 bit
50+ Expert Coaches|Hơn 50 huấn luyện viên chuyên nghiệp
AI-Powered Insights|Phân tích bằng AI
Active Cart Allocation:|Giỏ hàng hiện tại:
Active Member Privilege|Quyền lợi hội viên đang hoạt động
Active Vault|Gói đang hoạt động
Activity / Facility|Hoạt động / Cơ sở
Agentic Assistant|Trợ lý thông minh
Athletic Squads & Enterprise Corporate Plans|Gói dành cho đội thể thao và doanh nghiệp
Auth Node: Operational|Xác thực: Đang hoạt động
Availability:|Tình trạng chỗ:
Available Slots:|Chỗ còn trống:
Avg HR|Nhịp tim trung bình
Biometric|Sinh trắc học
Biometric Gear|Thiết bị sinh trắc học
Book courts, join classes, and track your athletic performance with real-time biometric integration at NEXUS.|Đặt sân, tham gia lớp và theo dõi hiệu suất thể thao với dữ liệu sinh trắc học trực tiếp tại NEXUS.
Capacity:|Sức chứa:
Check-in|Ghi nhận vào tập
Check-in QR|Mã QR vào tập
Chest heart rate monitors are provided for all performance sessions.|Thiết bị đo nhịp tim đeo ngực được cung cấp cho mọi buổi tập hiệu suất.
Claim Pro Access|Nhận quyền truy cập Pro
Class ID: #|Mã lớp: #
Classes & Attendance (|Lớp và điểm danh (
Click "Renew Course" to enroll member into the next upcoming session.|Bấm "Gia hạn khóa học" để đăng ký hội viên vào buổi tiếp theo.
Coach:|Huấn luyện viên:
Combat & Defense|Đối kháng và tự vệ
Complete Registration|Hoàn tất đăng ký
Course Fee:|Học phí:
Course:|Khóa học:
Create an account for walk-in customers directly at the front desk.|Tạo tài khoản cho khách đến trực tiếp tại quầy lễ tân.
DIGITAL CREDENTIAL STORE|QUẢN LÝ THẺ ĐIỆN TỬ
Deactivate|Ngừng hoạt động
Digital wristband credentials activate instantly|Thẻ vòng tay điện tử được kích hoạt ngay
Duration:|Thời hạn:
Elite Powerlifting|Cử tạ chuyên sâu
Elite Pro Member|Hội viên Elite Pro
Email updates require OTP verification. Changing it will log you out.|Đổi email cần xác minh OTP. Bạn sẽ được đăng xuất sau khi thay đổi.
Email:|Email:
Enrolled:|Đã đăng ký:
Enter the email associated with your NEXUS membership. We will send a 6-digit dynamic authentication PIN.|Nhập email tài khoản NEXUS. Chúng tôi sẽ gửi mã PIN xác thực 6 chữ số.
Equip your company or semi-pro sports franchise with pooled court access, biomechanical telemetry passes, and private training bookings.|Cung cấp cho doanh nghiệp hoặc đội thể thao quyền dùng sân chung, phân tích chuyển động và đăng ký huấn luyện riêng.
Explore and enroll in high-performance courses and training packages.|Khám phá và đăng ký các khóa học và gói huấn luyện chuyên sâu.
Express Actions|Thao tác nhanh
Express Check-in|Vào tập nhanh
Featured Lab Packs|Gói nổi bật
Find|Tìm kiếm
Find and enroll into next recurring course|Tìm và đăng ký khóa định kỳ tiếp theo
Flexible Carry-Over|Chuyển tiếp linh hoạt
Full Course:|Toàn bộ khóa:
Get|Nhận
HIIT Endurance|Sức bền HIIT
HIIT Endurance in 1h 45m|Sức bền HIIT sau 1 giờ 45 phút
High-intensity interval training designed to push your cardiovascular limits and build explosive power.|Tập ngắt quãng cường độ cao để cải thiện sức bền tim mạch và sức mạnh bùng nổ.
Hold near turnstile optical scanner|Đưa thẻ gần máy quét tại cổng
ID Protected|Mã định danh được bảo vệ
IT Support Desk|Quầy hỗ trợ kỹ thuật
Instant 15% discount applied at checkout|Giảm ngay 15% khi thanh toán
Instant Access Portal|Cổng truy cập nhanh
Instant Biometric & RFID Locker Re-sync|Đồng bộ ngay sinh trắc học và tủ RFID
Instant NFC & QR Pass Provisioning|Cấp ngay thẻ NFC và QR
Instant NFC Band Sync|Đồng bộ vòng tay NFC ngay
Invoice #|Hóa đơn #
Keyword: "$|Từ khóa: "$
Latency: 18ms|Độ trễ: 18ms
Learn practical self-defense mixed with intense conditioning and striking techniques.|Học kỹ năng tự vệ thực tế kết hợp rèn thể lực và kỹ thuật ra đòn.
Live Sync|Đồng bộ trực tiếp
Loyalty Program|Chương trình khách hàng thân thiết
MEMBER ID|MÃ HỘI VIÊN
Manage and inspect all trainees enrolled in your athletic coaching sessions and classes.|Quản lý và xem mọi học viên đăng ký buổi huấn luyện và lớp của bạn.
Manage athlete profile and personal details.|Quản lý hồ sơ và thông tin cá nhân của hội viên.
Manage your athletic coaching, group fitness classes, and digitized court bookings.|Quản lý huấn luyện, lớp tập nhóm và lịch đặt sân.
Manage your purchased membership benefits, specialized combos, and bio-tech lab privileges.|Quản lý quyền lợi gói đã mua, combo chuyên biệt và dịch vụ công nghệ thể thao.
Master the big three lifts with expert form correction and progressive overload programming.|Nắm vững ba bài nâng tạ chính với hướng dẫn kỹ thuật và tăng tải theo lộ trình.
Member & Name|Hội viên và tên
Member ID|Mã hội viên
Member ID: #MEM-|Mã hội viên: #MEM-
NEXUS Sports Center Receptionist Portal|Cổng lễ tân trung tâm thể thao NEXUS
NFC READY|NFC SẴN SÀNG
Nexus Certified Athletic Coach|Huấn luyện viên được Nexus chứng nhận
Nexus Points|Điểm Nexus
Nexus Rewards|Phần thưởng Nexus
Nexus Sports Center introduction|Giới thiệu trung tâm thể thao Nexus
Nexus Sports Lab provides world-class coaching, elite facilities, and data-driven training programs to help you achieve your ultimate fitness goals.|Nexus Sports Lab cung cấp huấn luyện chuyên nghiệp, cơ sở hiện đại và chương trình tập dựa trên dữ liệu để giúp bạn đạt mục tiêu thể chất.
No results found matching keyword "$|Không tìm thấy kết quả phù hợp với từ khóa "$
Official Nexus Center Trainee|Học viên chính thức tại Nexus
Only|Chỉ
Package: $|Gói: $
Packages & Passes (|Gói và thẻ (
Peak booked:|Đăng ký cao nhất:
Performance Protocol Access|Quyền sử dụng chương trình hiệu suất
Phone:|Điện thoại:
Profile & Notes|Hồ sơ và ghi chú
Protecting your personal athletic metrics, biometric data, and facility access reservations across our network.|Bảo vệ chỉ số thể thao, dữ liệu sinh trắc học và lịch đặt cơ sở của bạn trong hệ thống.
Pts|Điểm
Q3 Optimization Windows Open|Đang mở đợt tối ưu quý 3
RECEPTIONIST FEATURES|CHỨC NĂNG LỄ TÂN
Reach 500 Pts for 5% Off|Đạt 500 điểm để giảm 5%
Recent Activity & Check-in Log|Hoạt động gần đây và lịch sử vào tập
Reload Classes|Tải lại lớp học
Repeats on:|Lặp vào:
Reserved|Đã giữ chỗ
Restore Access to Your|Khôi phục truy cập
Role:|Vai trò:
Room:|Phòng:
SSL Encrypted|Mã hóa SSL
STEP 2 OF 3|BƯỚC 2 TRÊN 3
Safety Code|Mã an toàn
Scan your Nexus Pass QR code at the gate 10 minutes prior for automatic check-in.|Quét mã QR Nexus Pass tại cổng trước 10 phút để tự động ghi nhận vào tập.
Search members by Name, Phone number, Email or Member ID (#MEM). View membership status and course history.|Tìm hội viên theo tên, điện thoại, email hoặc mã (#MEM). Xem trạng thái gói và lịch sử khóa học.
Search tiers, cryo, passes...|Tìm hạng gói, phục hồi lạnh, thẻ...
Secure 256-bit SSL Encryption|Mã hóa SSL 256 bit an toàn
Security Protocol &middot; Auth Gateway v4.9|Bảo mật · Cổng xác thực v4.9
Select|Chọn
Select a date on the calendar grid to inspect scheduled sessions, then click to view registered trainees and mark attendance for each class.|Chọn ngày trên lịch để xem buổi tập, sau đó bấm vào buổi để xem học viên và điểm danh.
Select a member to view active course enrolments and automatically book next recurring classes.|Chọn hội viên để xem đăng ký khóa hiện tại và đăng ký lớp định kỳ tiếp theo.
Senior Coach|Huấn luyện viên cấp cao
Session Details|Chi tiết buổi tập
Simulate Tap|Mô phỏng quét thẻ
Start your fitness journey and access live court bookings, class schedules, and elite personal coaching.|Bắt đầu hành trình tập luyện với đặt sân, lịch lớp và huấn luyện cá nhân chuyên nghiệp.
Starts On:|Bắt đầu ngày:
Status: $|Trạng thái: $
Synced|Đã đồng bộ
Synchronizes with your smart sports membership.|Đồng bộ với tài khoản hội viên thể thao thông minh.
Syncing packages from backend...|Đang đồng bộ gói từ hệ thống...
System Configuration|Cấu hình hệ thống
System Role|Vai trò hệ thống
System automatically found the closest recurring session for member|Hệ thống tìm được buổi định kỳ gần nhất cho hội viên
Target Course:|Khóa học cần đăng ký:
Telemetry Metrics|Chỉ số tập luyện
Telemetry synchronization: Connected to Nexus Core|Đồng bộ dữ liệu: Đã kết nối Nexus Core
This feature is currently under development for the Receptionist role. You can switch back to|Chức năng này đang được phát triển cho lễ tân. Bạn có thể quay lại
Time Remaining|Thời gian còn lại
Toggle quick roster list below|Mở hoặc đóng danh sách học viên bên dưới
Trainee ID: #|Mã học viên: #
Trainer / Zone|Huấn luyện viên / Khu vực
Type:|Loại:
UID:|Mã tài khoản:
Unused bio-lab sessions rollover up to 60 days|Buổi chưa dùng được chuyển tiếp tối đa 60 ngày
Upgrade your athletic journey with sports-science grade memberships, specialized recovery combos, and bio-tech lab privileges.|Nâng cao tập luyện với gói khoa học thể thao, combo phục hồi và dịch vụ công nghệ sinh học.
VERIFIED ATHLETE|HỘI VIÊN ĐÃ XÁC MINH
Verified turnstile entries and biometric session outputs|Lượt vào cổng đã xác nhận và dữ liệu buổi tập
Verify Your|Xác minh
Verify your registered credentials to instantly sync your training telemetry, smart court reservations, and biometric baseline data.|Xác minh tài khoản để đồng bộ dữ liệu tập luyện, lịch đặt sân và chỉ số sinh trắc học.
Welcome to your teaching dashboard. Easily manage your upcoming group fitness sessions, inspect enrolled trainee rosters, and track class schedules.|Chào mừng đến trang giảng dạy. Quản lý các buổi tập nhóm, xem danh sách học viên và theo dõi lịch lớp.
Zero Setup Fees &bull; Cancel Anytime|Không phí thiết lập · Hủy bất cứ lúc nào
Zero Telemetry Loss Across Active Workouts|Giữ đầy đủ dữ liệu trong suốt buổi tập
absent|vắng mặt
active|đang hoạt động
at any time.|bất cứ lúc nào.
dates|ngày
days) -|ngày) -
e.g. Interested in Basketball & Badminton classes...|Ví dụ: Quan tâm lớp bóng rổ và cầu lông...
e.g. John Doe|Ví dụ: Nguyễn Văn An
min|phút
none|không có
present|có mặt
present /|có mặt /
seats ·|chỗ ·
Â© 2026 NEXUS Sports Technology Inc.|© 2026 NEXUS Sports Technology Inc.
`;
for(const line of extra.trim().split('\n')) { const i=line.indexOf('|'); const en=line.slice(0,i),vi=line.slice(i+1); translations[en]=[en,vi]; }
const vietnamese = {
  'Đăng xuất':'Log out','Đóng':'Close','Hủy':'Cancel','Đang gửi...':'Sending...',
  'Gửi Thông Báo':'Send notification','Gửi Thông Báo Cho Học Viên':'Send notification to trainees',
  'Gửi thông báo':'Send notification','Gửi tin':'Send message','Gửi thông báo riêng':'Send private notification',
  'Gửi thông báo cho lớp này':'Send notification to this class','Báo tin lớp':'Notify class',
  'Tạo & truyền tải thông báo trực tiếp đến học viên':'Create and send notifications directly to trainees',
  'Học viên cá nhân':'Individual trainees','Theo lớp học':'By class','Tất cả học viên':'All trainees',
  'Chọn học viên nhận thông báo:':'Select recipients:','Chọn lớp học:':'Select class:',
  'Loại thông báo':'Notification type','Tiêu đề thông báo':'Notification title','Nội dung thông báo':'Notification content',
  'Nhập nội dung chi tiết muốn truyền tải tới học viên...':'Enter the message to send to trainees...',
  'VD: Thay đổi lịch tập tuần tới / Nhắc nhở bài tập...':'e.g. Schedule changes next week / Exercise reminder...',
  '1. Phạm vi người nhận thông báo':'1. Notification recipients','-- Chưa có học viên nào --':'-- No trainees yet --',
  '-- Chưa có lớp học nào --':'-- No classes yet --','Chi tiết':'Details','Chưa đến ngày học':'Session has not started',
  'Điểm danh Có Mặt':'Mark present','Điểm danh Vắng Mặt':'Mark absent','Đặt trạng thái Chưa điểm danh':'Mark not yet recorded',
  '⚠️ Thông báo khẩn':'⚠️ Urgent notification','💬 Lời nhắn HLV':'💬 Coach message','📅 Nhắc lịch học':'📅 Class reminder','📢 Thông báo chung':'📢 General notification',
  'Gá»­i thĂ´ng bĂ¡o':'Send notification',
};
for (const [vi,en] of Object.entries(vietnamese)) translations[vi] = [en,vi === 'Gá»­i thĂ´ng bĂ¡o' ? 'Gửi thông báo' : vi];
const dynamic = {
  'Continue as {0}':'Tiếp tục với vai trò {0}',
  '{0} of {1} seats booked':'Đã đăng ký {0} trên {1} chỗ',
  '{0} pagination':'Phân trang {0}',
  'View session {0}, {1} {2}':'Xem buổi tập {0}, {1} {2}',
  'Actions for {0}':'Thao tác cho {0}', 'Actions for {0}, {1}':'Thao tác cho {0}, {1}',
  'Session #{0}':'Buổi tập #{0}',
  'CONFIRMED + PENDING bookings / capacity of non-cancelled sessions ({0}/{1}).':'Đăng ký đã xác nhận + đang chờ / sức chứa buổi không bị hủy ({0}/{1}).',
  'Create session on {0} at 09:00 for {1}':'Tạo buổi ngày {0} lúc 09:00 cho {1}',
  'Edit {0}':'Chỉnh sửa {0}', '{0} for {1}':'{0} cho {1}',
  'You will be asked to set a new password for {0}.':'Bạn sẽ được yêu cầu đặt mật khẩu mới cho {0}.',
  'Permanently delete {0} selected account{1}. This cannot be undone.':'Xóa vĩnh viễn {0} tài khoản đã chọn. Không thể hoàn tác.',
  'Updated {0}':'Cập nhật {0}', 'Page {0} of {1}':'Trang {0} trên {1}',
  '{0} result':'{0} kết quả','{0} results':'{0} kết quả','{0} selected':'Đã chọn {0}',
  'Select {0}':'Chọn {0}', 'Sort by {0}':'Sắp xếp theo {0}',
  'This will suspend {0} account and revoke access.':'Thao tác này khóa {0} tài khoản và thu hồi quyền truy cập.',
  'This will suspend {0} accounts and revoke access.':'Thao tác này khóa {0} tài khoản và thu hồi quyền truy cập.',
  '{0} account locked.':'Đã khóa {0} tài khoản.','{0} accounts locked.':'Đã khóa {0} tài khoản.',
  'Exported {0} account.':'Đã xuất {0} tài khoản.','Exported {0} accounts.':'Đã xuất {0} tài khoản.',
  'Manager':'Quản lý','Account':'Tài khoản','Name':'Tên','Information':'Thông tin','Plan':'Gói',
  'Account details':'Chi tiết tài khoản','Close account details':'Đóng chi tiết tài khoản',
  'Account summary':'Tóm tắt tài khoản','Contact and permission details':'Thông tin liên hệ và quyền',
  'Upload a new avatar':'Tải ảnh đại diện mới','No plan history.':'Chưa có lịch sử gói.',
  'Signed in':'Đã đăng nhập','Profile reviewed':'Đã xem hồ sơ',
  'Lock account':'Khóa tài khoản','Lock selected accounts':'Khóa tài khoản đã chọn','Lock accounts':'Khóa tài khoản',
  'Reason':'Lý do','Enter a reason for the system log':'Nhập lý do ghi vào nhật ký hệ thống',
  'A reason is required.':'Cần nhập lý do.',
  'The signed-in account and the last active manager cannot be locked or demoted.':'Không thể khóa hoặc hạ quyền tài khoản đang đăng nhập và quản lý đang hoạt động cuối cùng.',
  'Loading staff accounts':'Đang tải tài khoản nhân sự','No staff accounts found':'Không tìm thấy tài khoản nhân sự',
  'Try clearing filters or add a new account.':'Thử xóa bộ lọc hoặc thêm tài khoản mới.',
  'Account unlocked.':'Đã mở khóa tài khoản.','Avatar updated.':'Đã cập nhật ảnh đại diện.',
  'Dismiss notification':'Đóng thông báo','Coach Dashboard':'Tổng quan huấn luyện viên',
  'Teaching Schedule & Trainees':'Lịch giảng dạy và học viên','Nexus Portal':'Cổng Nexus',
  'Customer':'Khách hàng','Book & manage activities':'Đăng ký và quản lý hoạt động',
  'Operate the sports center':'Vận hành trung tâm thể thao','Coach & track members':'Huấn luyện và theo dõi hội viên',
  'Manage center operations':'Quản lý vận hành trung tâm','Customer Support':'Hỗ trợ khách hàng',
  'All sessions starting today, excluding cancellations.':'Mọi buổi bắt đầu hôm nay, không tính buổi bị hủy.',
  'Today through 7 days':'Hôm nay đến 7 ngày tới',
  'Active plans expiring today through the next 7 days.':'Gói đang hoạt động hết hạn từ hôm nay đến 7 ngày tới.',
  'Upcoming scheduled sessions below 25% capacity. Confirmed and pending bookings both count as reserved seats.':'Buổi sắp tới có dưới 25% sức chứa được đăng ký. Đăng ký đã xác nhận và đang chờ đều giữ chỗ.',
  'No low registrations':'Không có buổi ít đăng ký','Quick view from limited data':'Xem nhanh từ dữ liệu giới hạn',
  'urgent':'cần xử lý sớm','today':'hôm nay','upcoming':'sắp tới',
  'Just now':'Vừa xong','{0}m ago':'{0} phút trước','{0}h ago':'{0} giờ trước','{0}d ago':'{0} ngày trước',
  'Payment #{0}':'Thanh toán #{0}','Membership for {0}':'Gói hội viên của {0}',
  'Confirm':'Xác nhận','Complete session?':'Hoàn thành buổi tập?',
  'Unable to load this page.':'Không tải được trang này.','Unable to load data.':'Không tải được dữ liệu.',
  'Unable to save changes.':'Không lưu được thay đổi.','Unable to load the roster.':'Không tải được danh sách học viên.',
  'Unable to save this change.':'Không lưu được thay đổi này.',
  'Google login failed!':'Đăng nhập Google thất bại!','Please enter a valid email address.':'Vui lòng nhập email hợp lệ.',
  'Invalid email or password!':'Email hoặc mật khẩu không đúng!',
  'Coordinate classes, schedules, subjects, and rooms.':'Phối hợp lớp, lịch tập, bộ môn và phòng.',
};
for (const [en,vi] of Object.entries(dynamic)) translations[en]=[en,vi];
const notices = `
Active Member|Hội viên đang hoạt động
Access to premium gym facilities|Sử dụng phòng gym cao cấp
App telemetry sync|Đồng bộ dữ liệu tập luyện
Are you sure you want to delete ALL notifications? This action cannot be undone.|Bạn muốn xóa TẤT CẢ thông báo? Thao tác này không thể hoàn tác.
Assign an active class to this resource first.|Phân công một lớp đang hoạt động cho nguồn lực này trước.
Audit logs|Nhật ký hệ thống
Avatar images must be 2 MB or smaller.|Ảnh đại diện phải có dung lượng tối đa 2 MB.
Biometric Telemetry|Dữ liệu sinh trắc học
Book classes|Đăng ký lớp học
Book or Cancel Classes for Members|Đăng ký hoặc hủy lớp cho hội viên
Cancel all future sessions before deactivating a class.|Hủy mọi buổi sắp tới trước khi ngừng lớp.
Capacity per session|Sức chứa mỗi buổi
Cart cleared successfully|Đã xóa giỏ hàng
Center operations|Vận hành trung tâm
Check Package Status & Validity|Kiểm tra trạng thái và thời hạn gói
Checkout Error|Lỗi thanh toán
Choose a PNG or JPEG image.|Chọn ảnh PNG hoặc JPEG.
Choose a room to see its capacity.|Chọn phòng để xem sức chứa.
Class deactivated.|Đã ngừng lớp học.
Class roster|Danh sách học viên lớp
Coach Portal|Cổng huấn luyện viên
Coach Trainer|Huấn luyện viên
Combo Package subscribed successfully!|Đã đăng ký gói Combo!
Complete session|Hoàn thành buổi tập
Connecting NFC to unlock locker #42...|Đang kết nối NFC để mở tủ #42...
Consult biomechanics coaches|Tư vấn với huấn luyện viên cơ sinh học
Deactivate class|Ngừng lớp học
Elite Member since 2024|Hội viên Elite từ năm 2024
Email is required.|Cần nhập email.
Enrollment Failed|Đăng ký thất bại
Enter a non-negative amount below 100,000,000, with at most 2 decimals.|Nhập số tiền không âm, nhỏ hơn 100.000.000 và tối đa 2 chữ số thập phân.
Enter a positive whole number.|Nhập số nguyên dương.
Enter a valid email address.|Nhập địa chỉ email hợp lệ.
Existing bookings and resource conflicts are checked when saving.|Đăng ký hiện tại và xung đột nguồn lực được kiểm tra khi lưu.
Failed to cancel class|Không hủy được lớp
Failed to clear cart|Không xóa được giỏ hàng
Failed to complete renewal.|Không hoàn tất được gia hạn.
Failed to delete all notifications|Không xóa được tất cả thông báo
Failed to delete notification|Không xóa được thông báo
Failed to enroll into next class.|Không đăng ký được lớp tiếp theo.
Failed to enroll. Please try again.|Đăng ký thất bại. Vui lòng thử lại.
Failed to fetch invoices|Không tải được hóa đơn
Failed to fetch notifications|Không tải được thông báo
Failed to fetch profile|Không tải được hồ sơ
Failed to load cart items. Please try again.|Không tải được giỏ hàng. Vui lòng thử lại.
Failed to load packages|Không tải được gói
Failed to load packages list.|Không tải được danh sách gói.
Failed to load packages. Please try again later.|Không tải được gói. Vui lòng thử lại sau.
Failed to load schedules|Không tải được lịch
Failed to load your packages. Please try again later.|Không tải được gói của bạn. Vui lòng thử lại sau.
Failed to mark all as read|Không đánh dấu được tất cả đã đọc
Failed to mark as read|Không đánh dấu được đã đọc
Failed to register new member.|Không đăng ký được hội viên mới.
Failed to remove item.|Không gỡ được mục này.
Failed to resend code.|Không gửi lại được mã.
Failed to reset password. Please try again.|Không đặt lại được mật khẩu. Vui lòng thử lại.
Failed to send OTP|Không gửi được OTP
Failed to send OTP. Please try again.|Không gửi được OTP. Vui lòng thử lại.
Failed to subscribe package.|Không đăng ký được gói.
Failed to update profile|Không cập nhật được hồ sơ
Fitness Enthusiast|Người yêu thích tập luyện
From the equipment to the environment, Nexus provides a premium experience that makes you want to push harder every single day.|Từ thiết bị đến không gian, Nexus mang lại trải nghiệm cao cấp giúp bạn có động lực tập tốt hơn mỗi ngày.
Full access|Toàn quyền truy cập
Full facility access|Sử dụng toàn bộ cơ sở
Full name is required.|Cần nhập họ và tên.
Hello! I am NEXUS AI. How can I assist you with your fitness journey today? (e.g. "I want to lose 5kg", "Which yoga class is good?")|Xin chào! Tôi là NEXUS AI. Tôi có thể hỗ trợ gì cho việc tập luyện của bạn? (Ví dụ: "Tôi muốn giảm 5kg", "Lớp yoga nào phù hợp?")
Hide password|Ẩn mật khẩu
I've tried many gyms, but the AI-driven insights and personalized programs here are on another level. Worth every penny.|Tôi đã thử nhiều phòng gym, nhưng phân tích AI và chương trình cá nhân hóa ở đây vượt trội. Rất đáng tiền.
Invalid OTP|OTP không hợp lệ
Invalid OTP code!|Mã OTP không hợp lệ!
Invalid or expired OTP code.|Mã OTP không hợp lệ hoặc đã hết hạn.
Item removed from cart.|Đã gỡ mục khỏi giỏ hàng.
Loading Smart Court layout...|Đang tải sơ đồ sân...
Locker & Facility Access|Truy cập tủ và cơ sở
Manage & Renew Member Packages|Quản lý và gia hạn gói hội viên
Manage accounts|Quản lý tài khoản
Manage digital locker keys|Quản lý khóa tủ điện tử
Manage staff|Quản lý nhân sự
Marathon Runner|Người chạy marathon
Mark this ended session completed|Đánh dấu buổi đã kết thúc là hoàn thành
Member account registered successfully!|Đã đăng ký tài khoản hội viên!
Member records|Hồ sơ hội viên
Must accommodate the largest class assigned to this room.|Phải đủ chỗ cho lớp đông nhất được phân công vào phòng này.
New account|Tài khoản mới
New password|Mật khẩu mới
Nexus Gym Facility|Phòng gym Nexus
Nexus Pass QR|Mã QR Nexus Pass
No description|Chưa có mô tả
No email|Chưa có email
No notes or sports interests recorded for this member.|Hội viên chưa có ghi chú hoặc sở thích thể thao.
No payment data found in URL.|Không tìm thấy dữ liệu thanh toán trong đường dẫn.
No phone number|Chưa có số điện thoại
No upcoming recurring schedule found for this class.|Không có lịch định kỳ sắp tới cho lớp này.
No upcoming recurring schedule found for this course.|Không có lịch định kỳ sắp tới cho khóa này.
Not marked|Chưa điểm danh
Not updated|Chưa cập nhật
Number of sessions (including the first)|Số buổi (gồm buổi đầu)
Only active classes assigned to this resource are available.|Chỉ có thể chọn lớp đang hoạt động được phân công vào nguồn lực này.
Only scheduled sessions that have ended can be completed.|Chỉ buổi đã lên lịch và kết thúc mới có thể đánh dấu hoàn thành.
Password is required.|Cần nhập mật khẩu.
Password must be 6–72 characters.|Mật khẩu phải có 6–72 ký tự.
Password must be at least 8 characters long.|Mật khẩu phải có ít nhất 8 ký tự.
Passwords do not match.|Mật khẩu không khớp.
Payment Successful! Your courses are now confirmed.|Thanh toán thành công! Các khóa học của bạn đã được xác nhận.
Payment failed or signature is invalid.|Thanh toán thất bại hoặc chữ ký không hợp lệ.
Payment failed. Please try again.|Thanh toán thất bại. Vui lòng thử lại.
Please enter all 6 digits of the OTP code!|Vui lòng nhập đủ 6 chữ số OTP!
Please enter all 6 digits of the OTP code.|Vui lòng nhập đủ 6 chữ số OTP.
Please try again.|Vui lòng thử lại.
Powerlifting Competitor|Vận động viên cử tạ
Premium Sports & Fitness Laboratory|Trung tâm thể thao và thể chất cao cấp
Processing your payment result...|Đang xử lý kết quả thanh toán...
Receive & Log Member Requests|Tiếp nhận và ghi yêu cầu hội viên
Record Payments & Issue Invoices|Ghi nhận thanh toán và xuất hóa đơn
Repeat every (weeks)|Lặp mỗi (tuần)
Reserve Smart Court|Đặt sân thông minh
Role is required.|Cần chọn vai trò.
Room and coach are inherited from the class.|Phòng và huấn luyện viên theo lớp đã chọn.
Select a valid date range: the start date cannot be after the end date.|Chọn khoảng ngày hợp lệ: ngày bắt đầu không thể sau ngày kết thúc.
Session cancelled. Its bookings were cancelled and members notified.|Đã hủy buổi tập, hủy đăng ký và thông báo cho hội viên.
Session completed.|Đã hoàn thành buổi tập.
Show password|Hiện mật khẩu
Smart locker usage|Sử dụng tủ thông minh
Sorry, the AI system is currently busy. Please try again later.|Hệ thống AI đang bận. Vui lòng thử lại sau.
Standard access|Quyền truy cập tiêu chuẩn
Status is required.|Cần chọn trạng thái.
Successfully enrolled into the next recurring class!|Đã đăng ký lớp định kỳ tiếp theo!
Successfully renewed and enrolled into the next class!|Đã gia hạn và đăng ký lớp tiếp theo!
Syncing data with your Apple Watch/Garmin...|Đang đồng bộ dữ liệu với Apple Watch/Garmin...
System is matching you with an available trainer...|Hệ thống đang tìm huấn luyện viên phù hợp...
Temporary password|Mật khẩu tạm thời
The Combat & Defense class gave me confidence I never knew I had. The community here is incredibly supportive and focused.|Lớp đối kháng và tự vệ giúp tôi tự tin hơn. Cộng đồng ở đây rất hỗ trợ và tập trung.
The coaches don't just train you; they educate you on biomechanics and nutrition. It's a complete ecosystem for health.|Huấn luyện viên không chỉ hướng dẫn tập mà còn chia sẻ về cơ sinh học và dinh dưỡng. Đây là môi trường chăm sóc sức khỏe toàn diện.
The end time must be after the start time.|Giờ kết thúc phải sau giờ bắt đầu.
The new start time must be in the future.|Giờ bắt đầu mới phải ở tương lai.
This field is required.|Trường này là bắt buộc.
Total session capacity|Tổng sức chứa các buổi
Training at Nexus Sports Lab completely transformed my physique and mindset. The coaches are elite and the facilities are world-class.|Tập tại Nexus Sports Lab đã thay đổi thể chất và tư duy của tôi. Huấn luyện viên chuyên nghiệp và cơ sở rất tốt.
Unable to load billing history.|Không tải được lịch sử thanh toán.
Unable to save. Please try again.|Không lưu được. Vui lòng thử lại.
Unknown Course|Khóa học chưa xác định
Use at most 255 characters.|Tối đa 255 ký tự.
Use the existing center resources.|Sử dụng nguồn lực hiện có của trung tâm.
Verification successful! Your account has been activated.|Xác minh thành công! Tài khoản đã được kích hoạt.
Yes, Cancel Class|Xác nhận hủy lớp
Yoga Practitioner|Người tập yoga
You must agree to the Terms of Service!|Bạn phải đồng ý với Điều khoản dịch vụ!
An error occurred, please try again!|Có lỗi xảy ra, vui lòng thử lại!
`;
for(const line of notices.trim().split('\n')) { const i=line.indexOf('|'); const en=line.slice(0,i),vi=line.slice(i+1); translations[en]=[en,vi]; }
const viNotices = {
 'Gửi cho 1 học viên cụ thể.':'Send to one specific trainee.', 'Gửi cho lớp được chọn.':'Send to the selected class.',
 'Gửi thông báo thành công!':'Notification sent successfully!', 'Không thể gửi thông báo. Vui lòng thử lại sau.':'Unable to send notification. Please try again later.',
 'Không thể lưu điểm danh':'Unable to save attendance', 'Lỗi khi lưu điểm danh':'Error saving attendance',
 'Vui lòng chọn học viên.':'Please select a trainee.', 'Vui lòng chọn lớp học.':'Please select a class.',
 'Vui lòng nhập nội dung thông báo.':'Please enter notification content.', 'Vui lòng nhập tiêu đề thông báo.':'Please enter notification title.',
 'Điểm danh đã được lưu thành công!':'Attendance saved successfully!', 'Đã có lỗi xảy ra.':'An error occurred.',
 'Học viên (':'Trainees (', 'học viên | Phòng:':'trainees | Room:',
};
for(const [vi,en] of Object.entries(viNotices)) translations[vi]=[en,vi];
const finalLabels = {
 'All ({0})':'Tất cả ({0})','Recovery':'Phục hồi', 'Tennis, Basketball & Padel':'Quần vợt, bóng rổ và padel',
 'VO2 Max & recovery index':'VO2 Max và chỉ số phục hồi',
 'Edit session':'Chỉnh sửa buổi tập','Edit class':'Chỉnh sửa lớp','Edit room':'Chỉnh sửa phòng','Edit subject':'Chỉnh sửa bộ môn',
 'Edit package':'Chỉnh sửa gói','Create room':'Tạo phòng','Create subject':'Tạo bộ môn','Create package':'Tạo gói',
 'Send to all {0} of your trainees.':'Gửi chung cho toàn bộ {0} học viên của bạn.',
 'Send to {0} trainees enrolled in "{1}".':'Gửi tới {0} học viên đăng ký lớp "{1}".',
 'Send privately to {0} ({1}).':'Gửi riêng cho học viên {0} ({1}).',
};
for(const [en,vi] of Object.entries(finalLabels)) translations[en]=[en,vi];
Object.assign(translations, {
  '{0} · {1}–{2} · {3} · {4} · {5}/{6}':['{0} · {1}–{2} · {3} · {4} · {5}/{6}','{0} · {1}–{2} · {3} · {4} · {5}/{6}'],
  'Schedules':['Schedules','Lịch học'], 'Classes':['Classes','Lớp học'], 'Catalog':['Catalog','Danh mục'],
  'Seat occupancy':['Seat occupancy','Tỷ lệ đặt chỗ'],
  'Highest confirmed + pending booking count of any non-cancelled session.':['Highest confirmed + pending booking count of any non-cancelled session.','Số lượt đặt đã xác nhận và đang chờ cao nhất trong một buổi không bị hủy.'],
  'Pagination':['Pagination','Phân trang'], 'Catalog sections':['Catalog sections','Các danh mục'],
  'Sessions matching current filters in the visible date range.':['Sessions matching current filters in the visible date range.','Buổi tập khớp bộ lọc trong khoảng ngày đang xem.'],
  'Classes matching current filters.':['Classes matching current filters.','Tổng lớp khớp bộ lọc hiện tại.'],
  '{0}–{1} of {2}':['{0}–{1} of {2}','{0}–{1} trên {2}'],
  'Tuition / class registration':['Tuition / class registration','Học phí / lần đăng ký lớp'],
  'Highest bookings in one session: {0}':['Highest bookings in one session: {0}','Số lượt đặt cao nhất trong một buổi: {0}'],
  'Create recurring sessions':['Create recurring sessions','Tạo lịch lặp'],
  'Repeat sessions':['Create recurring sessions','Tạo lịch lặp'],
  'No classes yet':['No classes yet','Chưa có lớp học'],
  'No classes match your filters':['No classes match your filters','Không có lớp khớp bộ lọc'],
  'No matching sessions':['No matching sessions','Không có buổi tập khớp bộ lọc'],
  'No matching resources':['No matching resources','Không có phòng hoặc HLV khớp bộ lọc'],
  '{0} sessions':['{0} sessions','{0} buổi tập'],
  '+{0} more sessions':['+{0} more sessions','+{0} buổi nữa'],
  'Add session':['Add session','Thêm buổi tập'],
  'Search subjects':['Search subjects','Tìm bộ môn'], 'Search rooms':['Search rooms','Tìm phòng'],
  'View session {0}':['View session {0}','Xem buổi tập {0}'],
  'Operations data could not be loaded.':['Operations data could not be loaded.','Không thể tải dữ liệu vận hành.'],
  'Classes with future sessions cannot be deactivated; cancel those sessions first.':['Classes with future sessions cannot be deactivated; cancel those sessions first.','Lớp có buổi tập tương lai chưa thể ngưng hoạt động. Hãy hủy các buổi đó trước.'],
  '{0} upcoming sessions in the loaded range. Cancel these before deactivating.':['{0} upcoming sessions in the loaded range. Cancel these before deactivating.','Có {0} buổi sắp tới trong khoảng ngày đã tải. Hãy hủy trước khi ngưng lớp.'],
  'Cancel upcoming sessions before deactivating the class':['Cancel upcoming sessions before deactivating the class','Hãy hủy các buổi tập sắp tới trước khi ngưng lớp.'],
  'Calendar chips show sessions in chronological order, not a time axis; use details to compare times and check overlaps.':['Calendar chips show sessions in chronological order, not a time axis; use details to compare times and check overlaps.','Các buổi xếp theo thứ tự giờ, không theo trục thời gian. Mở chi tiết để so sánh giờ và kiểm tra trùng lịch.'],
  'Show next 20 sessions':['Show next 20 sessions','Xem 20 buổi tiếp theo'],
  'Low bookings · upcoming scheduled sessions below 25% capacity':['Low bookings · upcoming scheduled sessions below 25% capacity','Buổi ít lượt đặt · buổi sắp tới có dưới 25% sức chứa'],
  'No bookings': ['No bookings', 'Chưa có lượt đặt'],
  'Empty': ['Empty', 'Trống'],
  'Low': ['Low', 'Thấp'],
  '{0}/{1} booked': ['{0}/{1} booked', '{0}/{1} đã đặt'],
  'Interface language': ['Interface language', 'Ngôn ngữ giao diện'],
  'Front desk portal': ['Front desk portal', 'Cổng lễ tân'],
  '{0} activities · latest {1}': ['{0} activities · latest {1}', '{0} hoạt động · gần nhất {1}'],
  'Sun': ['Sun', 'CN'], 'Mon': ['Mon', 'T2'], 'Tue': ['Tue', 'T3'],
  'Wed': ['Wed', 'T4'], 'Thu': ['Thu', 'T5'], 'Fri': ['Fri', 'T6'], 'Sat': ['Sat', 'T7'],
  'booked': ['booked', 'đã đặt'],
  '{0} of {1} seats booked': ['{0} of {1} seats booked', 'Đã đặt {0} trên {1} chỗ'],
  'Today through 7 days': ['Within the next 7 days', 'Trong 7 ngày tới'],
  'After today · next 7 days': ['From tomorrow · within the next 7 days', 'Từ ngày mai · trong 7 ngày tới'],
  'No active plans expire in the next 7 days.': ['No plans expiring within the next 7 days.', 'Không có gói tập nào sắp hết hạn trong 7 ngày tới.'],
  'Low registrations': ['Low bookings', 'Buổi ít lượt đặt'],
  'No low registrations': ['No low bookings', 'Không có buổi ít lượt đặt'],
  'Low bookings in the next {0} hours.': ['Low bookings in the next {0} hours.', 'Buổi ít lượt đặt trong {0} giờ tới.'],
  'View all ({0})': ['View all ({0})', 'Xem tất cả ({0})'],
  'Active plans expiring today through the next 7 days.': ['Active plans expiring within the next 7 days.', 'Gói tập đang hoạt động sắp hết hạn trong 7 ngày tới.'],
  'Renewals to follow up today through the next 7 days': ['Renewals to follow up within the next 7 days', 'Các gói cần theo dõi gia hạn trong 7 ngày tới'],
  'Upcoming scheduled sessions below 25% capacity. Confirmed and pending bookings both count as reserved seats.': ['Upcoming scheduled sessions below 25% capacity. Confirmed and pending bookings both count as reserved seats.', 'Buổi sắp tới có dưới 25% sức chứa được đặt chỗ. Lượt đặt đã xác nhận và đang chờ đều giữ chỗ.'],
  'Payment · {0}': ['Payment · {0}', 'Thanh toán · {0}'],
  'Next: {0} {1}': ['Next: {0} {1}', 'Tiếp theo: {0} {1}'],
  'No sessions left today': ['No sessions left today', 'Không còn buổi tập hôm nay'],
  'in {0}h {1}m': ['in {0}h {1}m', 'Sau {0} giờ {1} phút'],
  Elevate: ['Elevate', 'Nâng tầm'],
  Your: ['Your', 'tiềm năng'],
  Physical: ['Physical', 'thể chất'],
  'Potential.': ['Potential.', 'của bạn.'],
});

const packageLabels = {
  'Please check the entered data.': 'Vui lòng kiểm tra dữ liệu đã nhập.',
  'The data is duplicated, in use, or was recently changed. Refresh and check again.': 'Dữ liệu bị trùng, đang được sử dụng hoặc vừa thay đổi. Hãy tải lại và kiểm tra.',
  'Invalid package type': 'Loại gói không hợp lệ',
  '1 day': '1 ngày',
  'Sort by': 'Sắp xếp theo',
  'Active filters': 'Bộ lọc đang áp dụng',
  '{0} days': '{0} ngày',
  'Manage membership plans, durations, and pricing.': 'Quản lý gói hội viên, thời hạn và giá bán.',
  'Active registrations': 'Đăng ký còn hiệu lực',
  'Counts active registration records. A member with several registrations is counted several times.': 'Đếm bản ghi đăng ký còn hiệu lực. Một hội viên có nhiều đăng ký sẽ được đếm nhiều lần.',
  '{0} active registrations': '{0} đăng ký còn hiệu lực',
  'Other package type': 'Loại gói khác',
  'Search packages by name': 'Tìm theo tên gói',
  'Package display mode': 'Chế độ hiển thị gói',
  'Table view': 'Dạng bảng',
  'Card view': 'Dạng thẻ',
  'Remove search filter': 'Bỏ bộ lọc tìm kiếm',
  'Remove package type filter': 'Bỏ bộ lọc loại gói',
  'Search: {0}': 'Tìm kiếm: {0}',
  '{0} ({1})': '{0} ({1})',
  '{0} · {1}': '{0} · {1}',
  'Ascending': 'Tăng dần',
  'Descending': 'Giảm dần',
  'Duplicate': 'Nhân bản',
  '(copy)': '(bản sao)',
  'Free': 'Miễn phí',
  'Approximately 1 year': '≈ 1 năm',
  'Approximately 1 month': '≈ 1 tháng',
  'Approximately 1 week': '≈ 1 tuần',
  'Approximately {0} months': '≈ {0} tháng',
  'Approximately {0} weeks': '≈ {0} tuần',
  'Edit package {0}': 'Sửa gói {0}',
  'Loading membership packages': 'Đang tải gói hội viên',
  'Membership packages could not be loaded.': 'Không thể tải gói hội viên.',
  'No packages yet': 'Chưa có gói hội viên',
  'No packages match your filters': 'Không có gói khớp bộ lọc',
  'Try a different search or package type.': 'Thử từ khóa hoặc loại gói khác.',
  'Create a membership package to get started.': 'Tạo gói hội viên để bắt đầu.',
  'Create membership package': 'Tạo gói hội viên',
  'Edit membership package': 'Sửa gói hội viên',
  'Package name is required.': 'Vui lòng nhập tên gói.',
  'Package name must be at most 255 characters.': 'Tên gói không được quá 255 ký tự.',
  'Select a valid package type.': 'Vui lòng chọn loại gói hợp lệ.',
  'Enter a whole number of days from 1 to 2,147,483,647.': 'Nhập số ngày nguyên từ 1 đến 2.147.483.647.',
  'Enter a price from 0 to 99,999,999.99 with up to two decimal places.': 'Nhập giá từ 0 đến 99.999.999,99 với tối đa hai chữ số thập phân.',
  'Enter package name': 'Nhập tên gói hội viên',
  'Up to 255 characters.': 'Tối đa 255 ký tự.',
  'Choose the access included in this package.': 'Chọn quyền sử dụng được bao gồm trong gói.',
  'Quick duration choices': 'Chọn nhanh thời hạn',
  'Enter number of days': 'Nhập số ngày',
  'Enter a positive whole number of days.': 'Nhập số ngày nguyên lớn hơn 0.',
  '0 is free. Use a comma for decimals; up to 99,999,999.99 ₫.': 'Giá 0 là miễn phí. Dùng dấu phẩy cho phần thập phân; tối đa 99.999.999,99 ₫.',
  'Existing registration end dates are unchanged. Some member screens display the price and duration from this package.': 'Ngày kết thúc của đăng ký hiện có không thay đổi. Một số màn hình hội viên hiển thị giá và thời hạn từ gói này.',
  'Discard unsaved changes?': 'Bỏ thay đổi chưa lưu?',
  'Your package changes have not been saved.': 'Các thay đổi của gói chưa được lưu.',
  'Discard changes': 'Bỏ thay đổi',
  'Package name already exists.': 'Tên gói đã tồn tại.',
};
for (const [en, vi] of Object.entries(packageLabels)) translations[en] = [en, vi];

const resourceImageLabels = {
  'Manage photo': 'Quản lý ảnh',
  'Room details': 'Chi tiết phòng',
  'View room': 'Xem phòng',
  'Photo of {0}': 'Ảnh của {0}',
  'No photo yet': 'Chưa có ảnh',
  'Choose photo': 'Chọn ảnh',
  'Replace photo': 'Thay ảnh',
  'Remove photo': 'Gỡ ảnh',
  'Save photo': 'Lưu ảnh',
  'Photo removed.': 'Đã gỡ ảnh.',
  'Photo saved.': 'Đã lưu ảnh.',
  'Clear selection': 'Bỏ ảnh đã chọn',
  'Select an image.': 'Vui lòng chọn ảnh.',
  'Choose a valid PNG or JPEG image.': 'Chọn ảnh PNG hoặc JPEG hợp lệ.',
  'Images must be 2 MB or smaller.': 'Ảnh không được vượt quá 2 MB.',
  'Images must contain at most 16 million pixels.': 'Ảnh không được vượt quá 16 triệu pixel.',
  'Unsupported image resource.': 'Loại tài nguyên này không hỗ trợ ảnh.',
  'Unable to save the image.': 'Không thể lưu ảnh.',
  'Unable to save the photo. Please try again.': 'Không thể lưu ảnh. Vui lòng thử lại.',
  'PNG or JPEG · max 2 MB. Photos are optimized on upload; transparent areas become white.': 'PNG hoặc JPEG · tối đa 2 MB. Ảnh được tối ưu khi tải lên; vùng trong suốt chuyển thành màu trắng.',
  'This photo is shown in the member package store.': 'Ảnh này hiển thị ở trang bán gói cho hội viên.',
  'This photo is shown on admin package cards and in the member package store.': 'Ảnh hiển thị trên thẻ gói của quản trị viên và trang bán gói cho hội viên.',
  'This photo is shown in resource details and as a small list thumbnail.': 'Ảnh hiển thị ở trang chi tiết và dưới dạng ảnh nhỏ trong danh sách.',
  'Remove this photo?': 'Gỡ ảnh này?',
  'The photo will be removed. The room, class or package will remain available.': 'Ảnh sẽ được gỡ. Phòng, lớp hoặc gói vẫn được giữ nguyên.',
  'The selected photo has not been saved.': 'Ảnh đã chọn chưa được lưu.',
};
for (const [en, vi] of Object.entries(resourceImageLabels)) translations[en] = [en, vi];

const packageBenefitLabels={
 'Subject package':'Gói theo bộ môn',
 'Subject benefits':'Quyền lợi theo bộ môn',
 'Set a separate session allowance for each subject. Package duration applies to every benefit.':'Quy định số buổi riêng cho từng môn. Thời hạn gói áp dụng cho mọi quyền lợi.',
 'Sessions':'Số buổi', 'Subject {0}':'Bộ môn {0}', 'Remove subject {0}':'Gỡ bộ môn {0}',
 'Search subjects':'Tìm bộ môn', 'Available subjects':'Bộ môn có thể thêm', 'Add {0}':'Thêm {0}',
 'Loading subjects...':'Đang tải bộ môn...', 'Subjects could not be loaded.':'Không thể tải bộ môn.',
 'No more subjects match.':'Không còn bộ môn phù hợp.', 'Create subjects in Center Operations first.':'Hãy tạo bộ môn trong Vận hành trung tâm trước.',
 'Select at least one subject for a subject package.':'Chọn ít nhất một bộ môn cho gói theo bộ môn.',
 'Select at most 100 subjects per package.':'Chọn tối đa 100 bộ môn cho mỗi gói.',
 'Each subject needs a unique selection and 1 to 10,000 sessions.':'Mỗi bộ môn chỉ chọn một lần, với số buổi từ 1 đến 10.000.',
 '{0} sessions':'{0} buổi', '{0} / {1} sessions available':'Còn {0} / {1} buổi',
 'Booking payment':'Hình thức đăng ký', 'Booking payment for {0}':'Hình thức đăng ký cho {0}',
 'Buy this course separately':'Mua lớp riêng', '{0} · {1} sessions remaining':'{0} · còn {1} buổi',
 'A package must cover every session and have enough remaining sessions for the whole course.':'Gói phải đủ số buổi cho cả lớp và mọi buổi đều nằm trong hạn sử dụng.',
 'Package benefits could not be loaded. Refresh to use a package.':'Không tải được quyền lợi. Tải lại trang để sử dụng gói.',
 'Booked using package benefits. No additional course payment is required.':'Đã đăng ký bằng quyền lợi gói. Không cần thanh toán thêm tiền lớp.',
 'Course added to cart. Complete payment to confirm your place.':'Đã thêm lớp vào giỏ hàng. Hoàn tất thanh toán để xác nhận chỗ.',
 'This package is inactive or does not include this subject.':'Gói chưa có hiệu lực hoặc không bao gồm bộ môn này.',
 'Every course session must fall within the package validity dates.':'Mọi buổi học phải nằm trong hạn sử dụng gói.',
 'Not enough remaining sessions for the whole course.':'Số buổi còn lại không đủ cho cả lớp.',
 "The new session time falls outside a registered member's package validity.":'Giờ học mới nằm ngoài hạn sử dụng gói của hội viên đã đăng ký.',
 'A class with registrations cannot be moved to another subject.':'Không thể đổi bộ môn của lớp đã có đăng ký.',
 'Purchased package benefits, price and duration are preserved. Changes apply to new purchases.':'Quyền lợi, giá và thời hạn của gói đã mua được giữ nguyên. Thay đổi áp dụng cho lượt mua mới.',
};
for(const [en,vi] of Object.entries(packageBenefitLabels)) translations[en]=[en,vi];
const packageTypeLabels={
 'Add package type':'Thêm loại gói','Rename package type':'Đổi tên loại gói',
 'Package type name':'Tên loại gói','Save package type':'Lưu loại gói',
 'Loading package types...':'Đang tải loại gói...', 'Package types could not be loaded.':'Không thể tải loại gói.',
 'Select a package type':'Chọn loại gói', 'Select an existing package type.':'Chọn loại gói có trong danh mục.',
 'Package type name must contain 1 to 255 characters.':'Tên loại gói phải có từ 1 đến 255 ký tự.',
 'A package type with this name already exists.':'Tên loại gói này đã tồn tại.',
 'Unable to save the package type.':'Không thể lưu loại gói.',
 'Require subject benefits for packages of this type':'Yêu cầu cấu hình bộ môn cho gói thuộc loại này',
 'Package types are shared categories. Benefits are configured separately for each package.':'Loại gói dùng để phân nhóm và dùng chung cho nhiều gói. Quyền lợi được cấu hình riêng cho từng gói.',
};
for(const [en,vi] of Object.entries(packageTypeLabels)) translations[en]=[en,vi];

const commerceLabels={
 'Package details':'Chi tiết gói','Loading package details...':'Đang tải chi tiết gói…','Unable to load package details.':'Không thể tải chi tiết gói.',
 'Description':'Mô tả','Terms':'Điều khoản','Purchase limit per member':'Giới hạn mua mỗi hội viên','Unlimited':'Không giới hạn','Selling status':'Trạng thái bán','Selling':'Đang bán','Stopped':'Ngừng bán','Stop selling':'Ngừng bán','Resume selling':'Mở bán lại',
 'Plain text, optional.':'Văn bản thuần, không bắt buộc.','Line breaks are preserved. Plain text, optional.':'Giữ nguyên xuống dòng. Văn bản thuần, không bắt buộc.',
 'Leave blank for unlimited. Set 1 for a one-time trial. Completed purchases count even after the package expires.':'Để trống nếu không giới hạn. Nhập 1 cho gói tập thử một lần. Lượt mua hoàn tất vẫn được tính khi gói hết hạn.',
 'Description must be at most 1,000 characters.':'Mô tả tối đa 1.000 ký tự.','Terms must be at most 10,000 characters.':'Điều khoản tối đa 10.000 ký tự.','Enter a positive whole number or leave blank for unlimited.':'Nhập số nguyên dương hoặc để trống nếu không giới hạn.',
 'No description provided.':'Chưa có mô tả.','No terms provided.':'Chưa có điều khoản.','Change history':'Lịch sử thay đổi','No changes recorded.':'Chưa có thay đổi được ghi nhận.','Unable to load change history.':'Không thể tải lịch sử thay đổi.',
 'Image changed':'Ảnh đã thay đổi','View package {0}':'Xem gói {0}',
 'This package will become available for new purchases again.':'Gói này sẽ được mở cho lượt mua mới.',
 'New purchases and renewals will be blocked. Existing registrations keep their benefits. Valid checkouts already issued can still complete. Active registrations: {0}':'Chặn lượt mua mới và gia hạn. Đăng ký hiện có giữ nguyên quyền lợi. Checkout hợp lệ đã phát hành vẫn có thể hoàn tất. Đăng ký còn hiệu lực: {0}',
 'This package is no longer selling. Choose a currently available package.':'Gói đã ngừng bán. Vui lòng chọn một gói đang bán.',
 'You have reached the purchase limit for this package.':'Bạn đã đạt giới hạn mua của gói này.',
 'A checkout for this package is awaiting payment. Complete it or wait for it to expire.':'Gói này có checkout đang chờ thanh toán. Hoàn tất hoặc đợi checkout hết hạn.',
 'A checkout is awaiting payment. Complete it or wait 15 minutes before changing the cart.':'Có checkout đang chờ thanh toán. Hoàn tất hoặc đợi hết hạn 15 phút trước khi thay đổi giỏ.',
 'Payment received and awaiting reconciliation. Contact reception.':'Đã nhận thanh toán và đang chờ đối soát. Vui lòng liên hệ lễ tân.','Payment failed or cancelled.':'Thanh toán thất bại hoặc đã hủy.','Payment completed.':'Thanh toán hoàn tất.',
 'packageName':'Tên gói','packageType':'Loại gói','durationDays':'Thời hạn','price':'Giá','description':'Mô tả','terms':'Điều khoản','benefits':'Quyền lợi','purchaseLimitPerMember':'Giới hạn mua','sellingStatus':'Trạng thái bán'
};for(const [en,vi] of Object.entries(commerceLabels))translations[en]=[en,vi];

const scopeLabels={'Applicable locations':'Địa điểm áp dụng','All locations':'Tất cả địa điểm','Search locations':'Tìm địa điểm','Search locations for {0}':'Tìm địa điểm cho {0}','Sessions are shared across the selected locations. No selection means all locations.':'Số buổi dùng chung giữa các địa điểm đã chọn. Không chọn riêng nghĩa là áp dụng tất cả địa điểm.','Select at most 100 unique locations per subject.':'Chọn tối đa 100 địa điểm khác nhau cho mỗi bộ môn.','This package does not cover the class location.':'Gói này không áp dụng tại địa điểm của lớp học.'};for(const [en,vi] of Object.entries(scopeLabels))translations[en]=[en,vi];

translations['Number of active registrations']=['Number of active registrations','Số đăng ký còn hiệu lực'];

Object.assign(translations, {
  'Back to Home': ['Back to Home', 'Quay lại trang chủ'],
});

Object.assign(translations, {
  'NEXUS AI can make mistakes. Verify before buying.': ['NEXUS AI can make mistakes. Verify before buying.', 'NEXUS AI có thể mắc lỗi. Vui lòng kiểm tra kỹ trước khi mua.'],
});

Object.assign(translations, {'Gain full access for ': ['Gain full access for ', 'Sử dụng toàn bộ dịch vụ trong ']});
