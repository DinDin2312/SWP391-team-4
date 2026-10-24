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
Create Nexus Account|Tạo tài khoản Nexus
Create Account|Tạo tài khoản
Creating Account...|Đang tạo tài khoản...
Join Nexus|Tham gia Nexus
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
Your Nexus account credentials have been synchronized. You can now log into your member dashboard.|Tài khoản Nexus đã được cập nhật. Bạn có thể đăng nhập vào trang hội viên.
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
Nexus Package Store|Cửa hàng gói Nexus
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
View Full Profile|Xem hồ sơ chi tiết
Current Package & Quotas|Gói tập & Hạn mức hiện tại
Time remaining:|Thời gian còn lại:
Gym & Equipment Access|Tập Gym & Thiết bị tự do
No active membership package|Chưa có gói tập hoạt động
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
Please select a member from the left list to review their classes and process renewal.|Chọn hội viên từ danh sách bên trái để xem lớp và gia hạn.
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
Ask Nexus AI|Hỏi Nexus AI
Ask anything...|Nhập câu hỏi...
Nexus AI can make mistakes. Verify before buying.|Nexus AI có thể sai. Hãy kiểm tra trước khi mua.
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
Book courts, join classes, and track your athletic performance with real-time biometric integration at Nexus.|Đặt sân, tham gia lớp và theo dõi hiệu suất thể thao với dữ liệu sinh trắc học trực tiếp tại Nexus.
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
Enter the email associated with your Nexus membership. We will send a 6-digit dynamic authentication PIN.|Nhập email tài khoản Nexus. Chúng tôi sẽ gửi mã PIN xác thực 6 chữ số.
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
Nexus Sports Center Receptionist Portal|Cổng lễ tân trung tâm thể thao Nexus
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
Â© 2026 Nexus Sports Technology Inc.|© 2026 Nexus Sports Technology Inc.
`;
for(const line of extra.trim().split('\n')) { const i=line.indexOf('|'); const en=line.slice(0,i),vi=line.slice(i+1); translations[en]=[en,vi]; }
const vietnameseEntries = [
  ['Đăng xuất', 'Log out'],
  ['Đóng', 'Close'],
  ['Hủy', 'Cancel'],
  ['Đang gửi...', 'Sending...'],
  ['Gửi Thông Báo', 'Send notification'],
  ['Gửi Thông Báo Cho Học Viên', 'Send notification to trainees'],
  ['Gửi thông báo', 'Send notification'],
  ['Gửi tin', 'Send message'],
  ['Gửi thông báo riêng', 'Send private notification'],
  ['Gửi thông báo cho lớp này', 'Send notification to this class'],
  ['Báo tin lớp', 'Notify class'],
  ['Tạo & truyền tải thông báo trực tiếp đến học viên', 'Create and send notifications directly to trainees'],
  ['Học viên cá nhân', 'Individual trainees'],
  ['Theo lớp học', 'By class'],
  ['Tất cả học viên', 'All trainees'],
  ['Chọn học viên nhận thông báo:', 'Select recipients:'],
  ['Chọn lớp học:', 'Select class:'],
  ['Loại thông báo', 'Notification type'],
  ['Tiêu đề thông báo', 'Notification title'],
  ['Nội dung thông báo', 'Notification content'],
  ['Nhập nội dung chi tiết muốn truyền tải tới học viên...', 'Enter the message to send to trainees...'],
  ['VD: Thay đổi lịch tập tuần tới / Nhắc nhở bài tập...', 'e.g. Schedule changes next week / Exercise reminder...'],
  ['1. Phạm vi người nhận thông báo', '1. Notification recipients'],
  ['-- Chưa có học viên nào --', '-- No trainees yet --'],
  ['-- Chưa có lớp học nào --', '-- No classes yet --'],
  ['Chi tiết', 'Details'],
  ['Chưa đến ngày học', 'Session has not started'],
  ['Điểm danh Có Mặt', 'Mark present'],
  ['Điểm danh Vắng Mặt', 'Mark absent'],
  ['Đặt trạng thái Chưa điểm danh', 'Mark not yet recorded'],
  ['⚠️ Thông báo khẩn', '⚠️ Urgent notification'],
  ['💬 Lời nhắn HLV', '💬 Coach message'],
  ['📅 Nhắc lịch học', '📅 Class reminder'],
  ['📢 Thông báo chung', '📢 General notification'],
  ['Gá»­i thĂ´ng bĂ¡o', 'Send notification'],
];
for (const [vi, en] of vietnameseEntries) translations[vi] = [en, vi === 'Gá»­i thĂ´ng bĂ¡o' ? 'Gửi thông báo' : vi];
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
Hello! I am Nexus AI. How can I assist you with your fitness journey today? (e.g. "I want to lose 5kg", "Which yoga class is good?")|Xin chào! Tôi là Nexus AI. Tôi có thể hỗ trợ gì cho việc tập luyện của bạn? (Ví dụ: "Tôi muốn giảm 5kg", "Lớp yoga nào phù hợp?")
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
  'Nexus AI can make mistakes. Verify before buying.': ['Nexus AI can make mistakes. Verify before buying.', 'Nexus AI có thể mắc lỗi. Vui lòng kiểm tra kỹ trước khi mua.'],
});

Object.assign(translations, {'Gain full access for ': ['Gain full access for ', 'Sử dụng toàn bộ dịch vụ trong ']});

const operationsDesignLabels = {
  "{0} results": "{0} kết quả",
  "Teaching schedule": "Lịch giảng dạy",
  "Review sessions, availability and bookings in the selected period.": "Theo dõi buổi tập, lịch sử dụng tài nguyên và lượt đặt trong khoảng đã chọn.",
  "Class directory": "Danh sách lớp học",
  "Manage teaching resources, capacity and tuition for each class.": "Quản lý huấn luyện viên, phòng, sức chứa và học phí của từng lớp.",
  "Subject directory": "Danh sách bộ môn",
  "Organize disciplines and their associated classes.": "Quản lý bộ môn và các lớp học thuộc từng môn.",
  "Room directory": "Danh sách phòng",
  "Review spaces, capacity and the classes assigned to each room.": "Theo dõi không gian tập, sức chứa và các lớp sử dụng từng phòng."
};
for (const [en, vi] of Object.entries(operationsDesignLabels)) translations[en] = [en, vi];

const operationFormLabels = {
 "Tuition (VND / class registration)":"Học phí (₫ / lần đăng ký lớp)",
 "Room capacity: {0}. Cannot be below existing booked/held seats.":"Sức chứa phòng: {0}. Không được thấp hơn số chỗ đã đặt hoặc đang giữ.",
 "{0} seats":"{0} chỗ"
};
for (const [en, vi] of Object.entries(operationFormLabels)) translations[en] = [en, vi];

const adminDesignLabels = {
 "Account directory":"Danh sách tài khoản",
 "Review account details, roles and access status.":"Theo dõi thông tin tài khoản, vai trò và trạng thái truy cập.",
 "Packages in catalog":"Gói trong danh sách",
 "Packages on sale":"Gói đang bán",
 "Package catalog":"Danh sách gói hội viên",
 "Organize pricing, availability and benefits for your members.":"Quản lý giá bán, trạng thái mở bán và quyền lợi dành cho hội viên.",
 "Package information":"Thông tin gói",
 "Description and terms":"Mô tả và điều khoản",
 "Usage benefits":"Quyền lợi sử dụng"
};
for (const [en, vi] of Object.entries(adminDesignLabels)) translations[en] = [en, vi];

const staffPermissionLabels = {
 "Membership":"Gói hội viên", "Profile":"Hồ sơ", "Full access":"Toàn quyền truy cập",
 "Manage accounts":"Quản lý tài khoản", "Audit logs":"Nhật ký hệ thống", "Manage staff":"Quản lý nhân sự",
 "Center operations":"Vận hành trung tâm", "Member records":"Hồ sơ hội viên", "Class roster":"Danh sách học viên", "Standard access":"Quyền truy cập cơ bản"
};
for (const [en, vi] of Object.entries(staffPermissionLabels)) translations[en] = [en, vi];

const reportDesignLabels = {
  'Reporting period':'Kỳ báo cáo', 'This month':'Tháng này', 'Last 7 days':'7 ngày gần nhất', 'Last 30 days':'30 ngày gần nhất', 'Date':'Ngày',
  'Apply the date range to update this report.':'Bấm Xem để cập nhật báo cáo theo khoảng ngày đã chọn.',
  'Performance summary':'Tổng quan hiệu quả', 'Successful payments only':'Chỉ tính thanh toán thành công',
  'Payments completed in this period':'Giao dịch hoàn tất trong kỳ', 'Invoices created in this period':'Hóa đơn được tạo trong kỳ',
  'Confirmed bookings by session date':'Lượt đặt đã xác nhận theo ngày học', 'Daily totals from successful payments.':'Tổng doanh thu thanh toán thành công theo ngày.',
  'Revenue (VND)':'Doanh thu (VND)', 'Only days with successful payments are shown.':'Chỉ hiển thị ngày có thanh toán thành công.',
  'Report data is unavailable.':'Chưa tải được dữ liệu báo cáo.', 'No successful payments in this period.':'Không có thanh toán thành công trong kỳ này.',
  'Top 10 classes by confirmed bookings.':'10 lớp có nhiều lượt đặt đã xác nhận nhất.', 'Total session capacity':'Tổng chỗ trong các buổi', 'Occupancy':'Tỷ lệ lấp đầy',
  'No class sessions in this period.':'Không có buổi học trong kỳ này.', 'Capacity is summed across sessions in the selected period.':'Sức chứa được cộng từ các buổi học trong khoảng ngày đã chọn.',
  'Package registrations':'Đăng ký theo gói', 'Top 5 packages by registrations.':'5 gói có nhiều lượt đăng ký nhất.',
  'No package registrations in this period.':'Không có đăng ký gói trong kỳ này.', 'Based on membership start date, not payment status.':'Tính theo ngày bắt đầu đăng ký, không theo trạng thái thanh toán.',
};
for (const [en, vi] of Object.entries(reportDesignLabels)) translations[en] = [en, vi];

const transactionLabels = {
  "Transactions": "Giao dịch",
  "Monitor system-wide invoices and payment history.": "Theo dõi hóa đơn và lịch sử thanh toán toàn hệ thống.",
  "Transaction view": "Loại dữ liệu giao dịch",
  "Payments": "Thanh toán",
  "Invoices": "Hóa đơn",
  "Invoice": "Hóa đơn",
  "Payment": "Thanh toán",
  "Invoice details": "Chi tiết hóa đơn",
  "Invoice total": "Tổng hóa đơn",
  "Payment attempts": "Các lần thanh toán",
  "payment attempts": "lần thanh toán",
  "Invoice status and payment status are tracked separately.": "Trạng thái hóa đơn và trạng thái thanh toán được theo dõi riêng.",
  "No payment recorded for this invoice.": "Hóa đơn này chưa ghi nhận thanh toán.",
  "This payment needs reconciliation. Verify the provider record before handling it; this screen does not change payment status.": "Giao dịch cần đối soát. Kiểm tra bản ghi từ đơn vị thanh toán trước khi xử lý; màn hình này không thay đổi trạng thái thanh toán.",
  "Invoice, transaction ID, member name or email": "Mã hóa đơn, mã giao dịch, tên hoặc email hội viên",
  "Dates filter payment records. Each row is one payment attempt.": "Lọc theo ngày ghi nhận thanh toán. Mỗi dòng là một lần thanh toán.",
  "Dates filter invoice creation. An invoice may have several payment attempts.": "Lọc theo ngày tạo hóa đơn. Một hóa đơn có thể có nhiều lần thanh toán.",
  "Payment history": "Lịch sử thanh toán",
  "Invoice history": "Lịch sử hóa đơn",
  "records": "bản ghi",
  "Payment / Invoice": "Thanh toán / Hóa đơn",
  "Payment status": "Trạng thái thanh toán",
  "Invoice status": "Trạng thái hóa đơn",
  "Created at": "Ngày tạo",
  "No matching transactions. Try another date range or filter.": "Không có giao dịch phù hợp. Hãy thử khoảng ngày hoặc bộ lọc khác.",
  "View transactions": "Xem giao dịch",
  "REVIEW": "Cần đối soát",
  "SUCCESS": "Thành công",
  "PAID": "Đã thanh toán",
  "FAILED": "Thất bại",
  "CANCELLED": "Đã hủy",
  "PENDING": "Đang chờ",
  "CASH": "Tiền mặt",
  "FREE": "Miễn phí",
  "Unknown": "Chưa xác định"
};
for (const [en, vi] of Object.entries(transactionLabels)) translations[en] = [en, vi];
Object.assign(translations, { 'Search': ['Search','Tìm kiếm'], 'Amount': ['Amount','Số tiền'], 'Apply filters': ['Apply filters','Áp dụng bộ lọc'], 'Package': ['Package','Gói hội viên'] });

const auditDesignLabels = {
  "Read-only history": "Lịch sử chỉ đọc",
  "Loaded records": "Bản ghi đã tải",
  "Recorded actors": "Người thực hiện",
  "Affected resource types": "Loại dữ liệu bị tác động",
  "Showing up to 100 latest records. Filters and counts apply to this loaded set.": "Hiển thị tối đa 100 bản ghi mới nhất. Bộ lọc và thống kê áp dụng trên các bản ghi đã tải.",
  "Audit filters": "Bộ lọc nhật ký",
  "Actor, action, resource or recorded details": "Người thực hiện, hành động, dữ liệu hoặc nội dung",
  "All actions": "Tất cả hành động",
  "All resources": "Tất cả dữ liệu",
  "Resource": "Dữ liệu",
  "Activity history": "Lịch sử hoạt động",
  "Who changed what, and when.": "Ai đã thay đổi gì, vào thời điểm nào.",
  "Recorded details": "Nội dung đã ghi nhận",
  "Record": "Bản ghi",
  "Changed field": "Trường thay đổi",
  "Before": "Trước thay đổi",
  "After": "Sau thay đổi",
  "Change recorded; previous and new values are unavailable.": "Đã ghi nhận thay đổi; không lưu giá trị trước và sau.",
  "Values appear exactly as recorded. Long text may have been shortened when logged.": "Hiển thị đúng giá trị được ghi nhận. Văn bản dài có thể đã được rút gọn khi lưu nhật ký.",
  "This record does not contain a before/after snapshot.": "Bản ghi này không lưu giá trị trước và sau thay đổi.",
  "View audit record": "Xem bản ghi nhật ký",
  "Audit data is unavailable.": "Chưa tải được dữ liệu nhật ký.",
  "No matching audit records.": "Không có bản ghi nhật ký phù hợp.",
  "Try another filter within the latest loaded records.": "Thử bộ lọc khác trong các bản ghi mới nhất đã tải.",
  "Recorded administrative changes will appear here.": "Các thao tác quản trị được ghi nhận sẽ xuất hiện tại đây.",
  "No details recorded.": "Không có nội dung chi tiết.",
  "Created": "Tạo mới",
  "Updated": "Cập nhật",
  "Deleted": "Xóa",
  "Status changed": "Đổi trạng thái",
  "Image updated": "Cập nhật ảnh",
  "Image removed": "Gỡ ảnh",
  "Avatar updated": "Cập nhật ảnh đại diện",
  "Payment needs review": "Thanh toán cần đối soát",
  "Account": "Tài khoản",
  "Membership package": "Gói hội viên",
  "Session": "Buổi tập",
  "Benefits": "Quyền lợi",
  "Terms": "Điều khoản"
};
for (const [en, vi] of Object.entries(auditDesignLabels)) translations[en] = [en, vi];

const reportCompletionLabels={
 "New members":"Hội viên mới", "Member accounts created during the selected period. All account statuses are included.":"Tài khoản hội viên tạo trong khoảng đã chọn, gồm mọi trạng thái tài khoản.",
 "{0} existing member accounts have no creation date.":"{0} tài khoản hội viên cũ chưa có dữ liệu ngày tạo.",
 "These accounts are excluded because their registration period cannot be verified. Newly created accounts are recorded automatically.":"Các tài khoản này không được tính vì chưa xác định được thời điểm đăng ký. Tài khoản tạo mới được ghi nhận ngày tạo tự động.",
 "{0} member accounts have no recorded creation date and are excluded from this count.":"{0} tài khoản hội viên chưa có ngày tạo được ghi nhận và không tính vào chỉ số này.",
 "Booking status breakdown":"Trạng thái đăng ký lớp", "By booking creation date, not session date. Statuses reflect the current state.":"Tính theo ngày tạo đăng ký, không phải ngày học. Trạng thái là trạng thái hiện tại.",
 "Other booking statuses":"Trạng thái đăng ký khác", "Role access":"Quyền của vai trò", "Select a role to review its access.":"Chọn vai trò để xem quyền truy cập.",
 "Access is predefined by the system. Selecting a role assigns its existing access; it does not customize individual permissions.":"Quyền được hệ thống quy định sẵn. Chọn vai trò để gán quyền hiện có, không cấu hình từng quyền riêng.",
 "Membership packages and pricing":"Gói hội viên và giá bán", "Reports and transactions":"Báo cáo và giao dịch", "Payments and invoices":"Thanh toán và hóa đơn", "Reception check-in":"Điểm danh tại quầy",
 "Assigned classes and students":"Lớp và học viên được phân công", "Training plans and feedback":"Kế hoạch tập và nhận xét", "Own profile and memberships":"Hồ sơ và gói hội viên cá nhân", "Personal schedule and training history":"Lịch cá nhân và lịch sử tập luyện"
};
for(const [en,vi] of Object.entries(reportCompletionLabels)) translations[en]=[en,vi];

// ==================== BẢN DỊCH TÍNH NĂNG ĐÁNH GIÁ TIẾN ĐỘ HỌC VIÊN (COACH ASSESSMENT) ====================
const assessmentLabels = {
  // Nút bấm & Tiêu đề
  "Evaluate Trainees": "Đánh Giá Học Viên",
  "Assessment": "Đánh giá",
  "Evaluate this trainee": "Đánh giá tiến độ học viên này",
  "Trainee Progress Assessment & Coach Feedback": "Đánh Giá Tiến Độ & Ghi Nhận Xét Học Viên",
  "Track physical metrics, evaluate fitness performance, and provide periodic feedback to trainees.": "Theo dõi chỉ số thể chất, chấm điểm thể lực và gửi phản hồi định kỳ cho học viên",
  "Coach Portal": "Cổng Huấn Luyện Viên",

  // Cột trái: Chọn lớp và học viên
  "1. Select Teaching Class": "1. Chọn Lớp Học Đang Dạy",
  "-- No classes yet --": "-- Chưa có lớp học nào --",
  "trainees": "học viên",
  "Search trainees in class...": "Tìm học viên trong lớp...",
  "Trainee list": "Danh sách học viên",
  "Selecting #": "Đang chọn #",
  "Loading list...": "Đang tải danh sách...",
  "No trainees enrolled in this class": "Lớp này chưa có học viên đăng ký",
  "Target Trainee": "Học viên mục tiêu",

  // Cột phải: Tabs & Form đánh giá
  "New Assessment": "Ghi Đánh Giá Mới",
  "Assessment History": "Lịch Sử Đánh Giá",
  "Refresh history": "Làm mới lịch sử",
  "Assessment Title": "Tiêu Đề Buổi Đánh Giá",
  "Optional, defaults to date": "Tùy chọn, mặc định theo ngày",
  "e.g. Week 1 fitness test / Squat technique check...": "VD: Đánh giá thể lực tuần 1 / Kiểm tra kỹ thuật Squat...",
  "Fitness & Technique Rating": "Đánh giá Thể lực & Kỹ thuật",
  "Attendance & Attitude": "Chuyên cần & Tinh thần",
  "Trainee Body Metrics": "Chỉ Số Cơ Thể Học Viên",
  "Fill in if measurement data is available": "Nhập nếu có số liệu đo lường",
  "Weight (kg)": "Cân nặng (kg)",
  "Height (cm)": "Chiều cao (cm)",
  "Body Fat (%)": "Tỷ lệ Mỡ (%)",
  "Muscle Mass (kg)": "Khối lượng Cơ (kg)",
  "Detailed Coach Feedback": "Nhận Xét Chi Tiết Của Huấn Luyện Viên",
  "Feedback on technique, posture, endurance, workout completion, and trainee improvements...": "Nhận xét về kỹ thuật động tác, tư thế, độ bền thể lực, mức độ hoàn thành bài tập và những điểm học viên đã cải thiện tốt...",
  "Nutrition & Extra Exercise Recommendations": "Lời Khuyên & Dặn Dò Dinh Dưỡng / Bài Tập Thêm",
  "e.g. Stretch after workout, drink 2L water daily, slightly increase weight on last set...": "VD: Chú ý giãn cơ sau buổi tập, bổ sung 2L nước mỗi ngày, tăng nhẹ mức tạ ở set cuối...",
  "Saving will automatically send a system notification to the trainee.": "Lưu sẽ tự động gửi thông báo hệ thống đến học viên.",
  "Saving assessment...": "Đang lưu đánh giá...",
  "Save Progress Assessment": "Lưu Đánh Giá Tiến Độ",

  // Tab lịch sử đánh giá
  "Loading assessment history...": "Đang tải lịch sử đánh giá...",
  "No assessment records yet": "Chưa có bản ghi đánh giá nào",
  "Switch to the \"New Assessment\" tab to start rating and giving feedback for this trainee.": "Chuyển sang tab \"Ghi Đánh Giá Mới\" để bắt đầu gửi nhận xét và chấm điểm tiến độ cho học viên này.",
  "Progress Assessment": "Đánh giá tiến độ",
  "Session Assessment": "Đánh giá buổi học",
  "Class:": "Lớp:",
  "Delete this assessment": "Xóa đánh giá này",
  "Weight:": "Cân nặng:",
  "Height:": "Chiều cao:",
  "Body Fat:": "Body Fat:",
  "Muscle mass:": "Khối lượng cơ:",
  "Coach Feedback:": "Nhận xét của Huấn Luyện Viên:",
  "Recommendation:": "Dặn dò:",

  // Thông báo lỗi, thông báo thành công & Hộp thoại xác nhận
  "Unable to load coach classes.": "Không thể tải danh sách lớp học của HLV.",
  "Unable to load class trainees.": "Không thể tải danh sách học viên của lớp.",
  "Please select a trainee to evaluate.": "Vui lòng chọn 1 học viên để thực hiện đánh giá.",
  "Please enter coach feedback for the trainee.": "Vui lòng nhập nhận xét chi tiết của HLV về học viên.",
  "Assessment saved and notification sent to trainee successfully!": "Đánh giá tiến độ đã được lưu và gửi thông báo tới học viên thành công!",
  "An error occurred while saving assessment.": "Có lỗi xảy ra khi lưu đánh giá.",
  "Error saving assessment.": "Lỗi khi lưu đánh giá.",
  "Are you sure you want to delete this assessment record?": "Bạn có chắc chắn muốn xóa bản ghi đánh giá này?",
  "Unable to delete assessment.": "Không thể xóa đánh giá.",

  // Nút Báo tin & Thông báo lớp trên lịch dạy
  "Notify": "Báo tin",
  "Notify Class": "Báo tin lớp",
  "Send Notification": "Gửi thông báo",
  "Send notification": "Gửi thông báo",
  "Send notification to this class": "Gửi thông báo cho lớp này"
};

for (const [en, vi] of Object.entries(assessmentLabels)) {
  translations[en] = [en, vi];
  translations[vi] = [en, vi];
}

// ==================== BẢN DỊCH GIAO BÀI TẬP (COACH WORKOUT PLANS) ====================
const workoutPlanLabels = {
  // Navigation & Tiêu đề chung
  "Coach Portal": "Cổng Huấn Luyện Viên",
  "Workout Management": "Quản lý bài tập",
  "Workout Plans": "Giao bài tập",
  "Assign Workout Plan to Trainees": "Giao Bài Tập Cho Học Viên",
  "Create and assign customized workouts to individual trainees or an entire class. System will automatically notify trainees upon assignment.": "Tạo và giao bài tập tùy chỉnh cho cá nhân 1 học viên hoặc toàn bộ học viên của một lớp. Hệ thống sẽ tự động gửi thông báo cho học viên ngay sau khi giao bài.",
  "Add New Exercise to Library": "Thêm Bài Tập Mới Vào Thư Viện",
  "Total Assigned Plans": "Tổng Giáo Án Đã Giao",
  "Managed Trainees": "Học Viên Quản Lý",
  "Exercise Library": "Thư Viện Bài Tập",
  "exercises": "bài tập",
  "movements": "động tác",
  "trainees": "học viên",

  // Tabs
  "Assign New Workout": "Giao Bài Tập Mới",
  "Assigned Plans History": "Lịch Sử Giáo Án Đã Giao",

  // Bước 1: Phạm vi
  "Select Assignment Scope": "Chọn Phạm Vi Giao Bài",
  "1. Assign to Individual Trainee": "1. Giao bài cho 1 Cá nhân",
  "Select a specific trainee to send a personalized training plan.": "Chọn chính xác 1 học viên để gửi giáo án huấn luyện riêng biệt.",
  "2. Assign to Entire Class": "2. Giao bài cho Toàn Lớp",
  "Automatically generate plans & notify all enrolled trainees in the selected class.": "Tự động tạo giáo án & gửi thông báo cho tất cả học viên trong lớp được chọn.",
  "Select Trainee to Receive Workout": "Chọn Học Viên Nhận Bài Tập",
  "-- Select trainee from list ({0}) --": "-- Chọn danh sách học viên ({0}) --",
  "-- Select trainee from list --": "-- Chọn danh sách học viên --",
  "Select Class": "Chọn Lớp Học",
  "-- Select class you are coaching ({0}) --": "-- Chọn lớp học bạn đang phụ trách ({0}) --",
  "-- Select class you are coaching --": "-- Chọn lớp học bạn đang phụ trách --",
  "Class: {0} ({1} enrolled trainees)": "Lớp: {0} ({1} học viên đã tham gia)",
  "enrolled trainees": "học viên đã tham gia",

  // Bước 2: Thông tin giáo án
  "Workout Plan Information & Instructions": "Thông Tin & Hướng Dẫn Giáo Án",
  "Plan Title": "Tiêu Đề Giáo Án",
  "e.g. Chest Hypertrophy Plan - Week 1": "VD: Giáo án Tăng Cơ Ngực - Tuần 1",
  "Notes / Coach Message (Optional)": "Ghi Chú / Lời Nhắn HLV (Tùy chọn)",
  "e.g. Rest strictly as specified, stay well hydrated...": "VD: Nghỉ đúng thời gian chỉ định, chú ý uống đủ nước...",

  // Bước 3: Chi tiết bài tập
  "Exercise Movements Details": "Chi Tiết Các Động Tác Tập Luyện",
  "Add Movement": "Thêm Động Tác",
  "Movement Name": "Tên Động Tác",
  "-- Select exercise from library --": "-- Chọn bài tập từ thư viện --",
  "Watch video tutorial": "Xem video hướng dẫn mẫu",
  "Sets": "Số Hiệp (Sets)",
  "Reps": "Số Lần/Hiệp (Reps)",
  "Rest (Seconds)": "Nghỉ (Giây)",
  "Remove exercise row": "Xóa dòng động tác",
  "Submitting will automatically send a push notification to trainees.": "Nhấn gửi sẽ đồng thời tạo thông báo đẩy tới tài khoản của học viên.",
  "Confirm & Send Workout Plan": "Xác Nhận Gửi Giáo Án & Thông Báo",
  "Processing & Sending...": "Đang xử lý & Gửi...",

  // Tab Lịch sử
  "All Trainees": "Tất cả học viên",
  "Refresh list": "Làm mới danh sách",
  "Loading workout plans...": "Đang tải danh sách giáo án...",
  "No Workout Plans Assigned Yet": "Chưa Có Giáo Án Nào Được Giao",
  "Switch to \"Assign New Workout\" tab to start creating plans for trainees.": "Hãy chuyển sang tab \"Giao Bài Tập Mới\" để bắt đầu soạn bài cho học viên.",
  "Movements count:": "Số động tác:",
  "Workout details": "Chi tiết giáo án",
  "Delete": "Xóa",
  "Coach note:": "Ghi chú HLV:",
  "Assigned to:": "Giao cho:",
  "General": "Chung",

  // Modal Chi tiết & Thêm bài tập
  "Add New Movement": "Thêm Động Tác Mới",
  "Add to library for repeated use": "Thêm vào thư viện để sử dụng lại nhiều lần",
  "Exercise Name": "Tên Bài Tập",
  "e.g. Bench Press, Plank, Deadlift...": "VD: Bench Press, Plank, Deadlift...",
  "Target Muscle Group": "Nhóm Cơ Tác Động",
  "Youtube Tutorial Link (Optional)": "Link Video Youtube Mẫu (Tùy chọn)",
  "Save to Library": "Lưu Vào Thư Viện",

  // Nhóm cơ
  "Chest (Ngực)": "Chest (Ngực)",
  "Back (Lưng/Xô)": "Back (Lưng/Xô)",
  "Legs (Đùi/Bắp chân)": "Legs (Đùi/Bắp chân)",
  "Shoulders (Vai)": "Shoulders (Vai)",
  "Arms (Tay trước/Tay sau)": "Arms (Tay trước/Tay sau)",
  "Abs (Bụng/Core)": "Abs (Bụng/Core)",
  "Cardio / Toàn thân": "Cardio / Toàn thân",

  // Messages & Alerts
  "Unable to load workout plans data.": "Không thể tải dữ liệu giáo án bài tập.",
  "Workout plan must contain at least 1 exercise.": "Giáo án phải có ít nhất 1 bài tập.",
  "Please enter workout plan title.": "Vui lòng nhập tiêu đề giáo án bài tập.",
  "Please select 1 trainee to assign workout.": "Vui lòng chọn 1 học viên để giao bài.",
  "Please select 1 class to assign workout to the entire class.": "Vui lòng chọn 1 lớp học để giao bài cho toàn bộ lớp.",
  "Workout assigned and notification sent successfully!": "Giao bài tập và gửi thông báo thành công!",
  "An error occurred while assigning workout plan.": "Có lỗi xảy ra khi giao bài tập.",
  "Unable to create new exercise.": "Không thể tạo bài tập mới.",
  "Are you sure you want to delete this assigned workout plan?": "Bạn có chắc chắn muốn xóa giáo án đã giao này không?",
  "Workout plan deleted successfully.": "Đã xóa giáo án thành công.",
  "Unable to delete workout plan.": "Không thể xóa giáo án.",
  "Please select an exercise for row {0}.": "Vui lòng chọn bài tập cho dòng số {0}.",
  "Added exercise": "Đã thêm bài tập",
  "to library!": "vào thư viện!",
  "Exercise list ({0})": "Danh sách bài tập ({0})",
  "Target muscle:": "Nhóm cơ:",
  "Set": "Hiệp",
  "Rep": "Lần",
  "Rest {0}s": "Nghỉ {0}s",
  "Close": "Đóng",
  "Cancel": "Hủy",
  "All trainees ({0} plans)": "Tất cả học viên ({0} giáo án)",
  "Trainee: {0}": "Học viên: {0}",
  "Trainee:": "Học viên:"
};

for (const [en, vi] of Object.entries(workoutPlanLabels)) {
  translations[en] = [en, vi];
  translations[vi] = [en, vi];
}

const workoutAndAssessmentDictionary = {
  // Navigation & Buttons
  "Assign Workout": "Giao bài",
  "Assign Workout Plan": "Giao bài tập",
  "Fitness Goals & Physical Level": "Mục tiêu tập luyện & Thể lực",
  "Personal Goal:": "Mục tiêu cá nhân:",
  "No workout goal set yet": "Chưa thiết lập mục tiêu tập luyện",
  "Coach Assigned Workout Plans:": "Giáo án HLV đã giao:",
  "Official Nexus Center Trainee": "Học viên chính thức Nexus Center",
  "View Assessments": "Xem đánh giá",
  "Assessments": "Đánh giá",
  "Workouts": "Bài tập",
  "View Workouts": "Xem bài tập",
  "View Class Workouts": "Xem bài tập lớp này",
  "View class workouts": "Xem bài tập lớp này",
  "View coach assigned workouts": "Xem bài tập được HLV giao",
  "View coach evaluations for this class": "Xem đánh giá của HLV cho lớp này",
  "View evaluations from coach": "Xem đánh giá từ Huấn luyện viên",
  "View Coach Evaluations": "Xem đánh giá",
  "Coach Evaluations": "Đánh Giá Từ Huấn Luyện Viên",
  "Coach Assessments": "Đánh Giá Từ Huấn Luyện Viên",
  "Trainee Progress Assessments": "Đánh Giá Tiến Độ Học Viên",
  "Assigned Workout Plans": "Bài Tập Huấn Luyện Viên Giao",
  "Class Workout Plan": "Giáo Án Thuộc Lớp",
  "Evaluation for Class": "Đánh Giá Thuộc Lớp",
  "New Assessment": "Ghi Đánh Giá Mới",
  "Record New Assessment": "Ghi Đánh Giá Mới",

  // Modal Headers & Subtitles
  "Training Progress": "Tiến độ tập luyện",
  "View and track detailed feedback, physical metrics and coach recommendations for each class.": "Xem nhận xét chi tiết, chỉ số thể chất và lời khuyên định hướng từ HLV theo từng lớp học.",
  "View and track detailed workout plans for each paid class.": "Xem và theo dõi giáo án chi tiết theo từng lớp học đã thanh toán.",
  "Summary of all coach evaluations": "Tổng hợp toàn bộ đánh giá từ HLV",
  "Summary of evaluations from coaches": "Tổng hợp đánh giá từ các Huấn luyện viên",
  "Summary of workouts in your enrolled classes": "Tổng hợp bài tập các lớp bạn đã đăng ký",
  "View all received workout plans": "Xem toàn bộ giáo án đã nhận",
  "Individual workout plan for each class.": "Giáo án cá nhân theo từng lớp học.",
  "Each class has a tailored workout plan from the coach to optimize training results.": "Mỗi lớp học có giáo án riêng biệt từ Huấn luyện viên phụ trách để tối ưu hiệu quả rèn luyện.",

  // Classes & Trainees
  "Enrolled Classes": "Lớp Học Đã Đăng Ký",
  "All Classes": "Tất Cả Lớp Học",
  "Loading classes list...": "Đang tải danh sách lớp học...",
  "You have no enrolled classes yet.": "Bạn chưa có lớp học nào đã hoàn tất đăng ký.",
  "You have no paid classes yet. Only paid classes will display workouts from coach!": "Bạn chưa có lớp học nào đã hoàn tất thanh toán. Chỉ những lớp đã thanh toán mới hiển thị bài tập từ HLV!",
  "You have no workouts assigned from classes yet.": "Bạn chưa có bài tập nào được giao từ các lớp học.",
  "Coach has not assigned a workout plan for this class yet. It will appear as soon as the coach submits it!": "Huấn luyện viên chưa giao giáo án cho lớp này. Giáo án sẽ tự động cập nhật ngay khi HLV gửi!",
  "Workout plan does not have specific exercises yet.": "Giáo án chưa có động tác cụ thể.",
  "Assigned Coach:": "Huấn luyện viên phụ trách:",
  "Unassigned Coach": "Chưa phân HLV",

  // Searches & Filters
  "Search by title, feedback, advice...": "Tìm theo tiêu đề, nhận xét, lời khuyên...",
  "Search by exercise name, muscle group...": "Tìm theo tên bài tập, nhóm cơ...",
  "No evaluations match your search keyword": "Không tìm thấy đánh giá phù hợp với từ khóa",
  "No matching workouts found": "Không tìm thấy bài tập phù hợp",
  "Try searching with a different keyword or clear search filter.": "Hãy thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc tìm kiếm.",
  "Try searching with a different keyword or clear filter.": "Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc.",
  "Recent": "Gần đây",
  "Personalized": "Cá nhân hóa",

  // Evaluation & Assessment Sections
  "Evaluation Details": "Chi tiết đánh giá",
  "Session Evaluation": "Đánh giá buổi tập",
  "Session Progress Evaluation": "Đánh giá tiến độ buổi tập",
  "Physical & Technical": "Thể lực & Kỹ thuật",
  "Attendance & Attitude": "Chuyên cần & Thái độ",
  "Body Metrics & Measurements": "Chỉ Số Thể Hình & Đo Lường",
  "Detailed Feedback from Coach": "Nhận xét chi tiết từ Huấn luyện viên",
  "Advice & Next Training Direction": "Lời khuyên & Định hướng tập luyện tiếp theo",
  "Loading evaluations from coach...": "Đang tải danh sách đánh giá từ Huấn luyện viên...",
  "No Evaluations Found Yet": "Chưa Có Đánh Giá Nào",
  "No evaluations recorded yet": "Chưa có bản ghi đánh giá nào",
  "Attendance saved successfully!": "Điểm danh đã được lưu thành công!",
  "Unable to save attendance": "Không thể lưu điểm danh",
  "Error saving attendance": "Lỗi khi lưu điểm danh",
  "Future session date ({0}). Attendance can only be marked on the day of the session.": "Chưa đến ngày học ({0}). Điểm danh chỉ được phép thực hiện vào đúng ngày học.",
  "Past session date ({0}). Attendance cannot be marked or changed once the date has passed.": "Buổi học đã trôi qua ({0}). Không thể điểm danh hoặc thay đổi điểm danh sau khi ngày học đã trôi qua.",
  "Coach will submit feedback, physical stats, and recommendations after your training sessions!": "Huấn luyện viên phụ trách sẽ gửi nhận xét, chỉ số thể lực và lời khuyên sau các buổi tập luyện của bạn!",

  // Body Metrics
  "Height": "Chiều cao",
  "Weight": "Cân nặng",
  "Muscle Mass": "Khối lượng cơ",
  "Body Fat (%)": "Tỷ lệ mỡ (Fat)",
  "Normal (Healthy)": "Bình thường (Chuẩn)",
  "Underweight": "Hơi gầy",
  "Slightly Overweight": "Thừa cân nhẹ",
  "Weight Loss Needed": "Cần giảm cân",

  // Performance Ratings
  "Excellent": "Xuất sắc",
  "Good": "Tốt",
  "Fair": "Khá",
  "Needs Improvement": "Cần cải thiện",
  "Needs More Effort": "Cần nỗ lực thêm",

  // Attendance Ratings
  "100% Perfect Attendance": "Chuyên cần 100%",
  "Full Attendance": "Đầy đủ",
  "Mostly Attended": "Tương đối đều",
  "Missed Some Sessions": "Vắng một số buổi",

  // Exercise & Workout Table Details
  "Exercise Details": "Chi tiết bài tập",
  "Exercise / Movement": "Động Tác / Bài Tập",
  "Movement Details": "Chi tiết động tác",
  "Sets": "Số Hiệp",
  "Sets (Count)": "Số Hiệp (Sets)",
  "Reps": "Số Lần (Reps)",
  "Reps/Set": "Số Lần/Hiệp (Reps)",
  "Rest Between Sets": "Nghỉ Giữa Hiệp",
  "Instructions": "Hướng Dẫn",
  "Coach Instructions:": "Lời dặn từ Huấn Luyện Viên:",
  "Plan:": "Giáo án:",
  "Watch technique video": "Xem video kỹ thuật",
  "Watch video tutorial": "Xem video hướng dẫn mẫu",
  "Loading class workouts list...": "Đang tải danh sách bài tập của lớp...",
  "No Workout Plans Assigned Yet": "Chưa Có Bài Tập Nào Được Giao",

  // Muscle Groups
  "Chest": "Chest (Ngực)",
  "Back": "Back (Lưng/Xô)",
  "Legs": "Legs (Đùi/Bắp chân)",
  "Shoulders": "Shoulders (Vai)",
  "Arms": "Arms (Tay trước/Tay sau)",
  "Abs": "Abs (Bụng/Core)",
  "Cardio / Full Body": "Cardio / Toàn thân",

  // Unpaid / Payment Warnings
  "Unpaid (Pay to receive workouts and evaluations)": "Chưa thanh toán (Thanh toán để nhận bài tập, đánh giá)",
  "Pay to confirm class and receive workouts and evaluations": "Thanh toán để xác nhận lớp và nhận bài tập, đánh giá",
  "Unpaid (Pay to receive workouts)": "Chưa thanh toán (Thanh toán để nhận bài tập)",
  "Pay now to confirm class and receive workouts": "Thanh toán để xác nhận lớp và nhận bài tập",

  // Coach Portal Features & Modals
  "Assign New Workout": "Giao Bài Tập Mới",
  "Assigned Plans History": "Lịch Sử Giáo Án Đã Giao",
  "Select Assignment Scope": "Chọn Phạm Vi Giao Bài",
  "1. Assign to Individual Trainee": "1. Giao bài cho 1 Cá nhân",
  "Select a specific trainee to send a personalized training plan.": "Chọn chính xác 1 học viên để gửi giáo án huấn luyện riêng biệt.",
  "2. Assign to Entire Class": "2. Giao bài cho Toàn Lớp",
  "Automatically generate plans & notify all enrolled trainees in the selected class.": "Tự động tạo giáo án & gửi thông báo cho tất cả học viên trong lớp được chọn.",
  "Select Trainee to Receive Workout": "Chọn Học Viên Nhận Bài Tập",
  "-- Select trainee from list --": "-- Chọn danh sách học viên --",
  "Select Class": "Chọn Lớp Học",
  "-- Select class you are coaching --": "-- Chọn lớp học bạn đang phụ trách --",
  "Workout Plan Information & Instructions": "Thông Tin & Hướng Dẫn Giáo Án",
  "Plan Title": "Tiêu Đề Giáo Án",
  "Notes / Coach Message (Optional)": "Ghi Chú / Lời Nhắn HLV (Tùy chọn)",
  "Exercise Movements Details": "Chi Tiết Các Động Tác Tập Luyện",
  "Add Movement": "Thêm Động Tác",
  "Movement Name": "Tên Động Tác",
  "-- Select exercise from library --": "-- Chọn bài tập từ thư viện --",
  "Rest (Seconds)": "Nghỉ (Giây)",
  "Remove exercise row": "Xóa dòng động tác",
  "Submitting will automatically send a push notification to trainees.": "Nhấn gửi sẽ đồng thời tạo thông báo đẩy tới tài khoản của học viên.",
  "Confirm & Send Workout Plan": "Xác Nhận Gửi Giáo Án & Thông Báo",
  "Processing & Sending...": "Đang xử lý & Gửi...",
  "All Trainees": "Tất cả học viên",
  "Refresh list": "Làm mới danh sách",
  "Loading workout plans...": "Đang tải danh sách giáo án...",
  "Switch to \"Assign New Workout\" tab to start creating plans for trainees.": "Hãy chuyển sang tab \"Giao Bài Tập Mới\" để bắt đầu soạn bài cho học viên.",
  "Switch to \"New Assessment\" tab to start submitting feedback and rating progress for this trainee.": "Chuyển sang tab \"Ghi Đánh Giá Mới\" để bắt đầu gửi nhận xét và chấm điểm tiến độ cho học viên này.",
  "Movements count:": "Số động tác:",
  "Workout details": "Chi tiết giáo án",
  "Coach note:": "Ghi chú HLV:",
  "Assigned to:": "Giao cho:",
  "General": "Chung",
  "Add New Movement": "Thêm Động Tác Mới",
  "Add to library for repeated use": "Thêm vào thư viện để sử dụng lại nhiều lần",
  "Exercise Name": "Tên Bài Tập",
  "Target Muscle Group": "Nhóm Cơ Tác Động",
  "Youtube Tutorial Link (Optional)": "Link Video Youtube Mẫu (Tùy chọn)",
  "Save to Library": "Lưu Vào Thư Viện",
  "Unable to load workout plans data.": "Không thể tải dữ liệu giáo án bài tập.",
  "Workout plan must contain at least 1 exercise.": "Giáo án phải có ít nhất 1 bài tập.",
  "Please enter workout plan title.": "Vui lòng nhập tiêu đề giáo án bài tập.",
  "Please select 1 trainee to assign workout.": "Vui lòng chọn 1 học viên để giao bài.",
  "Please select 1 class to assign workout to the entire class.": "Vui lòng chọn 1 lớp học để giao bài cho toàn bộ lớp.",
  "Workout assigned and notification sent successfully!": "Giao bài tập và gửi thông báo thành công!",
  "An error occurred while assigning workout plan.": "Có lỗi xảy ra khi giao bài tập.",
  "Unable to create new exercise.": "Không thể tạo bài tập mới.",
  "Are you sure you want to delete this assigned workout plan?": "Bạn có chắc chắn muốn xóa giáo án đã giao này không?",
  "Workout plan deleted successfully.": "Đã xóa giáo án thành công.",
  "Unable to delete workout plan.": "Không thể xóa giáo án.",
  "Please select an exercise for row": "Vui lòng chọn bài tập cho dòng số",
  "Added exercise": "Đã thêm bài tập",
  "to library!": "vào thư viện!",
  "Target muscle:": "Nhóm cơ:",
  "Set": "Hiệp",
  "Rep": "Lần",
  "exercises": "bài",
  "sets": "hiệp",
  "reps": "lần",
  "classes": "lớp",
  "evaluations": "đánh giá"
};

for (const [en, vi] of Object.entries(workoutAndAssessmentDictionary)) {
  translations[en] = [en, vi];
  translations[vi] = [en, vi];
}

const receptionistDictionary = {
  "Validity Remaining": "Thời hạn sử dụng còn lại",
  "Benefits & Quota": "Quyền lợi & Hạn mức",
  "Gym & Facility Access": "Tập Gym & Cơ sở vật chất",
  "Expiring Soon (≤ 7d)": "Sắp hết hạn (≤ 7 ngày)",
  "🟠 Expiring Soon (≤ 7 days)": "🟠 Sắp hết hạn (≤ 7 ngày)",
  "Click to filter members with packages expiring within 7 days": "Bấm để lọc hội viên có gói sắp hết hạn trong 7 ngày",
  "This membership package will expire within 7 days. Please remind the member to renew.": "Gói thành viên này sẽ hết hạn trong vòng 7 ngày tới. Vui lòng nhắc hội viên gia hạn.",
  "days": "ngày",
  "GYM_ACCESS": "Thẻ tập Gym & CSVC",
  "AI_ACCESS": "Gói huấn luyện AI",
  "COMBO": "Gói Combo",
  "COMBO_PROMO": "Gói Combo Khuyến Mãi",
  "SUBJECT_ACCESS": "Gói theo bộ môn",
  "Member Check-in (Gym & Facility)": "Check-in Hội Viên (Gym & CSVC)",
  "Member Check-in & Facility Access": "Check-in Hội Viên & Dịch Vụ Trung Tâm",
  "Front Desk Counter": "Quầy Lễ Tân Trực Tiếp",
  "Verify active gym/facility packages, record member entry & exit, and monitor live room occupancy.": "Kiểm tra gói tập, ghi nhận lượt vào/ra và theo dõi sức chứa phòng tập theo thời gian thực.",
  "Refresh Data": "Làm mới dữ liệu",
  "Total Check-ins": "Tổng lượt Check-in",
  "Today": "Hôm nay",
  "Currently In Center": "Đang ở trung tâm",
  "Active in gym/facilities": "Đang tập tại phòng/khu dịch vụ",
  "Checked Out": "Đã Check-out",
  "Completed sessions": "Đã hoàn thành buổi tập",
  "Facility Zones": "Khu vực / Phòng tập",
  "Available training rooms": "Phòng tập đang hoạt động",
  "1. Quick Member Check-in Desk": "1. Quầy Check-in Hội Viên Nhanh",
  "Search by member name, phone, email, or ID to verify package status.": "Tìm theo tên, SĐT, email hoặc mã hội viên để kiểm tra gói tập.",
  "Enter member name, phone, email or #ID...": "Nhập tên, SĐT, email hoặc #Mã HV...",
  "Searching members...": "Đang tìm kiếm hội viên...",
  "No matching members found.": "Không tìm thấy hội viên phù hợp.",
  "No phone": "Chưa có SĐT",
  "Expiring": "Sắp hết hạn",
  "Active Package": "Gói đang hiệu lực",
  "Expired": "Đã hết hạn",
  "No Package": "Chưa có gói",
  "Details": "Chi tiết",
  "Change": "Đổi",
  "Change member": "Đổi hội viên",
  "Clear search": "Xóa tìm kiếm",
  "Checking out...": "Đang Check-out...",
  "Member is currently checked in at the center": "Hội viên hiện đang có mặt tập luyện tại trung tâm",
  "Facility / Zone:": "Khu vực / Phòng tập:",
  "Package:": "Gói tập:",
  "Check-in Time:": "Giờ vào:",
  "Note:": "Ghi chú:",
  "Check-out Member Now": "Xác nhận Check-out cho hội viên ngay",
  "Checking member package eligibility...": "Đang kiểm tra gói tập của hội viên...",
  "Ineligible for Check-in: No Active Package": "Không đủ điều kiện Check-in: Chưa có gói hiệu lực",
  "This member does not have an active membership package or their package has expired. Please register or renew a package at the counter before checking in.": "Hội viên này chưa có gói tập còn hiệu lực hoặc gói đã hết hạn. Vui lòng đăng ký mới hoặc gia hạn gói tại quầy trước khi Check-in.",
  "Go to Packages & Renewals": "Chuyển sang Quản lý & Gia hạn gói",
  "2. Active Membership Package": "2. Gói thành viên đang hoạt động",
  "Expires:": "Hết hạn:",
  "days left": "ngày còn lại",
  "Valid Package:": "Gói hợp lệ:",
  "days remaining": "ngày còn lại",
  "Included Benefits:": "Quyền lợi bao gồm:",
  "3. Assign Gym / Facility Zone": "3. Chọn Phòng tập / Khu vực dịch vụ",
  "General Gym & Fitness Floor (Default)": "Khu tập Gym & Thể hình chung (Mặc định)",
  "In use:": "Đang tập:",
  "Not in package scope": "Ngoài phạm vi gói",
  "4. Counter Note / Locker Key (Optional)": "4. Ghi chú tại quầy / Chìa khóa tủ đồ (Tùy chọn)",
  "e.g., Locker #18, Towel issued, Morning workout...": "Ví dụ: Tủ đồ #18, mượn khăn, tập ca sáng...",
  "Processing Check-in...": "Đang xử lý Check-in...",
  "Confirm Member Check-in": "Xác nhận Check-in cho hội viên",
  "Click on a member from the list above to verify their membership and perform check-in.": "Bấm vào một hội viên từ danh sách trên để kiểm tra gói và thực hiện Check-in.",
  "Daily Check-in & Facility Attendance Log": "Nhật ký Check-in & Điểm danh cơ sở hàng ngày",
  "Real-time tracking of members currently training and completed visits.": "Theo dõi thời gian thực hội viên đang tập và các lượt đã hoàn tất ra về.",
  "Filter log by member name, phone, package, room, note...": "Lọc nhật ký theo tên, SĐT, gói, phòng, ghi chú...",
  "All Visits": "Tất cả lượt tập",
  "In Center": "Đang ở trung tâm",
  "Member": "Hội viên",
  "Package & Facility": "Gói tập & Khu vực",
  "Check-in / Out Time": "Giờ vào / Giờ ra",
  "Status": "Trạng thái",
  "Action": "Thao tác",
  "Loading check-in records...": "Đang tải dữ liệu Check-in...",
  "No check-in records found for the selected filter.": "Không có lượt Check-in nào khớp với bộ lọc đã chọn.",
  "In:": "Vào:",
  "Out:": "Ra:",
  "View Member Profile": "Xem hồ sơ hội viên",
  "Check-out": "Check-out",
  "Please choose a member first.": "Vui lòng chọn hội viên trước.",
  "Please select an active membership package to check in.": "Vui lòng chọn gói tập còn hiệu lực để Check-in.",
  "General Gym & Fitness Zone": "Khu vực Gym & CSVC chung",
  "Check-in successful for": "Check-in thành công cho",
  "Unable to complete member check-in.": "Không thể hoàn tất Check-in cho hội viên.",
  "Checked out successfully:": "Check-out thành công cho:",
  "Unable to check out member.": "Không thể Check-out cho hội viên.",
  "Gói tập chưa đến ngày bắt đầu hiệu lực": "Gói tập chưa đến ngày bắt đầu hiệu lực",
  "Upcoming - not yet active": "Chưa đến ngày hiệu lực",
  "Starts on:": "Bắt đầu từ:",
  "được đăng ký bắt đầu từ ngày": "được đăng ký bắt đầu từ ngày",
  "hết hạn": "hết hạn",
  "Hiện tại chưa đến ngày bắt đầu nên hội viên chưa thể Check-in vào tập.": "Hiện tại chưa đến ngày bắt đầu nên hội viên chưa thể Check-in vào tập.",
  "Check-in Purpose": "Mục đích Check-in",
  "Gym & General Facility Workout": "Tập tự do Gym & CSVC chung",
  "Attend Today's Class Session": "Tham gia lớp học hôm nay",
  "Today's Enrolled Classes": "Lớp học đã đăng ký hôm nay",
  "Class Session Check-in": "Check-in lớp học",
  "No class scheduled for today": "Hôm nay không có lịch lớp học",
  "Class Room & Schedule:": "Phòng & Giờ học:",
  "Coach:": "Huấn luyện viên:",
  "Class Attendance Note:": "Lưu ý điểm danh lớp:",
  "Coach will take attendance inside class. Front desk check-in records entry to center and assigns locker.": "Huấn luyện viên sẽ trực tiếp điểm danh trong lớp. Lễ tân chỉ ghi nhận vào trung tâm và cấp tủ đồ.",
  "Activate Early From Today": "Kích hoạt sớm từ hôm nay",
  "Activate this package starting today and proceed with check-in": "Kích hoạt gói này bắt đầu từ hôm nay và thực hiện Check-in",
  "Package Type": "Loại hình",
  "Class": "Lớp học",
  "Gym / Facility": "Gym / Dịch vụ",
  "Please select a class session to check in.": "Vui lòng chọn một buổi học để thực hiện Check-in.",
  "Check-in Type": "Hình thức",
  "Gym Workout": "Tập Gym / Dịch vụ",
  "Class Session": "Buổi học lớp",
  "Today's Classes:": "Lớp học hôm nay:",
  "No package required for booked class session": "Không cần gói tập khi đã đăng ký lớp học này",
  "Access Entitlements": "Quyền lợi dịch vụ",
  "Gym & Class": "Gym & Lớp học",
  "Gym Access": "Khu vực Gym",
  "Class Access": "Lớp học",
  "Gym & Equipment Area": "Khu vực Gym & Thiết bị",
  "Active Gym Package": "Gói tập Gym hợp lệ",
  "No active gym package": "Chưa có gói tập gym",
  "Today's Class": "Lớp học hôm nay",
  "No classes scheduled today": "Không có lịch học hôm nay",
  "Classroom": "Phòng học",
  "Early Activation:": "Kích hoạt sớm:",
  "Confirm Check-in": "Xác nhận Check-in",
  "Anomalies": "Bất thường",
  "Coach flagged absent": "HLV báo vắng",
  "Notice: Member was recorded absent by coach {0} time(s) after check-in.": "Lưu ý: Hội viên có {0} lần HLV ghi nhận vắng mặt sau khi check-in.",
  "Door Code:": "Mã cửa:",
  "Door code: {0}": "Mã mở cửa: {0}",
  "Combo Gym + Class": "Combo Gym + Lớp",
  "at": "lúc",
  "Cancel Session": "Hủy buổi học",
  "Cancel Course": "Hủy khóa học",
  "Cancel Class Booking": "Hủy lịch học",
  'Are you sure you want to cancel all {0} upcoming session(s) of course "{1}" for this member?': 'Bạn có chắc chắn muốn hủy tất cả {0} buổi học sắp tới của khóa "{1}" cho hội viên này không?',
  'Are you sure you want to cancel the session at {0} of course "{1}"?': 'Bạn có chắc chắn muốn hủy buổi học lúc {0} của khóa "{1}" không?',
  "The cancelled session quota will be automatically returned and restored into the member's package benefits.": "Số buổi tập đã hủy sẽ được tự động hoàn trả lại vào quyền lợi gói tập của hội viên.",
  "Cancellation Reason (Optional):": "Lý do hủy (Không bắt buộc):",
  "e.g. Member requested at front desk due to schedule conflict": "VD: Hội viên yêu cầu tại quầy do bận lịch đột xuất",
  "Confirm Cancellation": "Xác nhận hủy",
  "Cancelling...": "Đang hủy...",
  "Failed to cancel booking.": "Không thể hủy lịch học.",
  "Failed to cancel course.": "Không thể hủy khóa học.",
  "Course cancelled successfully. Quota refunded.": "Đã hủy khóa học thành công. Hạn mức buổi tập đã được hoàn trả.",
  "Session cancelled successfully. Quota refunded.": "Đã hủy buổi học thành công. Hạn mức buổi tập đã được hoàn trả.",
  "Scheduled": "Sắp diễn ra",
  "Attended": "Đã tham gia",
  "Absent": "Vắng mặt",
  "Cancelled": "Đã hủy",
  "sessions upcoming": "buổi sắp tới",
  "Click to expand/collapse sessions": "Nhấn để xem chi tiết / thu gọn các buổi học",
  "+ Enroll in Class": "+ Đăng ký lớp học",
  "Enroll in Class": "Đăng ký lớp học",
  "Enroll Member in Class": "Đăng ký lớp học cho hội viên",
  "Cancel Course For Member": "Hủy khóa học cho hội viên",
  "Select an upcoming class to enroll member": "Chọn một lớp học sắp diễn ra để ghi danh cho hội viên",
  "Loading available classes...": "Đang tải danh sách lớp học...",
  "No upcoming open classes found at this time.": "Hiện không có lớp học nào sắp mở.",
  "Already enrolled": "Đã đăng ký",
  "Class is full": "Lớp đã đủ người",
  "slots left": "chỗ trống",
  "Confirm Enrollment": "Xác nhận đăng ký",
  "Enrolling...": "Đang đăng ký...",
  "Member enrolled into class successfully!": "Hội viên đã được đăng ký vào lớp học thành công!",
  "Failed to enroll member into class.": "Không thể đăng ký lớp học cho hội viên.",
  "Find next recurring session to renew": "Tìm buổi học tiếp theo để gia hạn",
  "upcoming": "sắp tới",
  "Past Session": "Đã qua (Hết hạn)",
  "Course Renewal Notice": "Thông báo gia hạn khóa học",
  "No Upcoming Schedule Found": "Chưa có lịch khóa tiếp theo",
  "No upcoming recurring schedule found for course:": "Chưa tìm thấy lịch học tiếp theo cho khóa học:",
  "The center has not scheduled the next recurring batch for this course yet. You can enroll the member into another available class or check back later.": "Hiện tại trung tâm chưa xếp lịch cho lớp tiếp theo của bộ môn này. Bạn có thể chọn đăng ký một lớp học khác có sẵn cho hội viên hoặc kiểm tra lại sau.",
  "Enroll Another Class": "Đăng ký lớp khác",
  "No upcoming recurring schedule found for this course.": "Không tìm thấy lịch học tiếp theo phù hợp cho khóa học này.",
  "No upcoming recurring schedule found for this class.": "Không tìm thấy lịch học tiếp theo phù hợp cho lớp học này.",
  "Course & Membership Renewal": "Quản lý khóa học & Gia hạn",
  "Select a member to view active course enrolments and automatically book next recurring classes.": "Chọn một học viên để xem các khóa học đã tham gia và thực hiện gia hạn cho các lớp tiếp theo.",
  "Search member name / phone...": "Tìm theo tên hoặc số điện thoại...",
  "Find": "Tìm kiếm",
  "Loading members...": "Đang tải danh sách...",
  "No active members found.": "Không tìm thấy học viên nào.",
  "#MEM-": "#HV-",
  "No Member Selected": "Chưa chọn học viên",
  "Please select a member from the left list to review their classes and process renewal.": "Vui lòng chọn một học viên từ danh sách bên trái để xem các khóa học và thực hiện gia hạn.",
  "Member ID: #MEM-": "Mã HV: #MEM-",
  "View Full Profile": "Xem hồ sơ",
  "Reload Classes": "Tải lại danh sách",
  "Current Package & Quotas": "Gói hội viên & Quyền lợi",
  "● Active": "Đang kích hoạt",
  "● Inactive": "Chưa kích hoạt",
  "No active membership package": "Chưa có gói hội viên đang kích hoạt",
  "Type:": "Loại gói:",
  "Time remaining:": "Thời hạn còn lại:",
  "Gym & Equipment Access": "Sử dụng phòng tập & thiết bị",
  "Enrolled Courses": "Khóa học đã tham gia",
  "Enrolled Courses (": "Khóa học đã tham gia (",
  "Loading course enrolments...": "Đang tải danh sách khóa học...",
  "This member has no past or current course enrolments.": "Học viên này chưa tham gia khóa học nào.",
  "Course Name": "Tên khóa học",
  "Coach": "Huấn luyện viên",
  "Room": "Phòng tập",
  "Course Timeline": "Thời gian diễn ra",
  "Total Sessions": "Tổng số buổi",
  "sessions": "buổi",
  "Renewed": "Đã gia hạn",
  "Course already renewed to next batch. Click to view.": "Khóa học đã được gia hạn sang lớp tiếp theo. Bấm để xem chi tiết.",
  "Renew Course": "Đăng ký tiếp",
  "Enroll Next Recurring Course": "Đăng ký khóa học kỳ tiếp theo",
  "Enroll Next Term": "Đăng ký tiếp",
  "Enrolled in Next Term": "Đã đăng ký kỳ sau",
  "Enroll Next Term Course": "Đăng ký khóa học kỳ tiếp theo",
  "Current Course:": "Khóa học hiện tại:",
  "Familiar Schedule:": "Lịch học quen thuộc:",
  "Available Classes for Next Term:": "Danh sách lớp học mở cho kỳ tiếp theo:",
  "Select one class to enroll": "Chọn 1 lớp để ghi danh",
  "Best Match - Same Schedule": "Gợi ý khớp lịch cũ nhất",
  "Tuition Fee:": "Học phí khóa học:",
  "Schedule Conflict": "Trùng lịch học",
  "Starts:": "Khai giảng:",
  "Schedule:": "Lịch học:",
  "Target Course:": "Khóa học tiếp theo:",
  "Next Session Starts:": "Buổi học đầu tiên:",
  "Course Fee:": "Học phí:",
  "Availability:": "Chỗ trống:",
  "slots": "chỗ",
  "Payment Method": "Hình thức thanh toán",
  "Payment method at counter:": "Hình thức thanh toán:",
  "Cash": "Tiền mặt",
  "Bank Transfer": "Chuyển khoản",
  "Confirm Payment & Renew": "Xác nhận thu tiền & Gia hạn",
  "Confirm Payment & Enroll": "Xác nhận thu tiền & Đăng ký",
  "Confirm Payment & Subscribe": "Xác nhận thu tiền & Đăng ký",
  "Package Fee:": "Giá gói:",
  "Successfully renewed and enrolled into the next class!": "Gia hạn và đăng ký thành công cho lớp tiếp theo!",
  "Failed to complete renewal.": "Không thể hoàn tất gia hạn.",
  "Subscribe Combo Package": "Đăng ký gói hội viên",
  "Select Combo Package": "Chọn gói hội viên",
  "days) -": "ngày) -",
  "Activation Date": "Ngày kích hoạt",
  "Confirm Subscription": "Xác nhận đăng ký",
  "Subscribing...": "Đang đăng ký...",
  "Combo Package subscribed successfully!": "Đăng ký gói thành công!",
  "Failed to subscribe package.": "Không thể đăng ký gói.",
  "Select an upcoming class to enroll member {0}.": "Chọn một lớp học sắp diễn ra để ghi danh cho học viên {0}.",
  "Coach TBD": "Chưa có HLV",
  "Room TBD": "Chưa xếp phòng",
  "Selected Class:": "Lớp đã chọn:",
  "Course renewed successfully!": "Khóa học đã được gia hạn thành công!",
  "Member has been registered and enrolled into the next batch:": "Học viên đã được đăng ký và ghi danh vào lớp kế tiếp:",
  "Next Batch:": "Lớp tiếp theo:",
  "Coach / Room:": "HLV / Phòng:",
  "Timeline:": "Tiến trình:",
  "Total Sessions:": "Tổng số buổi:",
  "sessions (In schedule)": "buổi (Đã có trong lịch)",
  "1 day left (Expires today)": "Còn 1 ngày (Hết hạn hôm nay)",
  "1 day left": "Còn 1 ngày",

  // Invoices & Receipts (Feature 45 - Front Desk)
  "Invoices & Receipts": "Hóa đơn & Phiếu thu",
  "Front Desk Invoices & Receipts": "Hóa đơn & Phiếu thu tại quầy",
  "Look up recent payment transactions and print/export service receipts for members.": "Tra cứu các giao dịch thanh toán và in/xuất phiếu thu dịch vụ cho khách hàng.",
  "Search by invoice code (#INV-...), member name, phone...": "Tìm theo mã HĐ (#INV-...), tên khách hàng, số điện thoại...",
  "All Methods": "Tất cả phương thức",
  "All Time": "Tất cả thời gian",
  "Last 7 Days": "7 ngày qua",
  "This Month": "Tháng này",
  "Newest": "Mới nhất",
  "Oldest": "Cũ nhất",
  "Newest First": "Mới nhất trước",
  "Oldest First": "Cũ nhất trước",
  "No matching invoices found": "Chưa có hóa đơn nào phù hợp",
  "Try changing search keywords or adjusting filters.": "Thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh lại bộ lọc.",
  "Invoice No.": "Mã HĐ",
  "Date & Time": "Thời gian",
  "Customer": "Khách hàng",
  "Service": "Dịch vụ",
  "Amount": "Số tiền",
  "Cashier": "Người lập",
  "Print Receipt": "In HĐ",
  "Print Invoice": "In hóa đơn",
  "View / Print Receipt": "Xem / In Hóa đơn",
  "Invoice & Payment Receipt": "Hóa đơn & Biên lai thu tiền",
  "Service Payment Receipt": "Phiếu thu & Hóa đơn dịch vụ",
  "International Sports & Fitness Center": "Trung tâm Thể thao & Thể hình Quốc tế",
  "Member Information": "Thông tin hội viên / Member Info",
  "Walk-in Guest": "Khách vãng lai",
  "Service / Course Name": "Tên dịch vụ / Khóa học",
  "Service Type": "Loại dịch vụ",
  "Duration / Sessions": "Thời lượng / Buổi",
  "Unit Price": "Đơn giá",
  "Total": "Thành tiền",
  "Sports Service": "Dịch vụ thể thao",
  "Front Desk Sports Service": "Dịch vụ thể thao tại quầy",
  "Reference No.": "Mã tham chiếu",
  "Cashier / Receptionist": "Thu ngân / Lễ tân",
  "Total Payment": "Tổng thanh toán",
  "Payer / Customer": "Người nộp tiền / Khách hàng",
  "(Signature & Full Name)": "(Ký, ghi rõ họ tên)",
  "Thank you for using our services at Nexus Sport Center!": "Cảm ơn Quý khách đã sử dụng dịch vụ tại Nexus Sport Center!",
  "Cash (CASH)": "Tiền mặt (CASH)",
  "Bank Transfer (TRANSFER)": "Chuyển khoản (TRANSFER)",
  "PAID": "ĐÃ THANH TOÁN",
  "COMPLETED": "HOÀN TẤT",
  "Total Invoices": "Số lượng hóa đơn",
  "Total Receipts": "Tổng phiếu thu",
  "Loading invoice list...": "Đang tải danh sách hóa đơn...",
  "Refresh": "Làm mới",
  "Recent Transactions": "Giao dịch gần đây"
};

const workoutDictionary = {
  // Days of Week & Calendar
  "Monday": "Thứ Hai",
  "Tuesday": "Thứ Ba",
  "Wednesday": "Thứ Tư",
  "Thursday": "Thứ Năm",
  "Friday": "Thứ Sáu",
  "Saturday": "Thứ Bảy",
  "Sunday": "Chủ Nhật",
  "Mon": "T2",
  "Tue": "T3",
  "Wed": "T4",
  "Thu": "T5",
  "Fri": "T6",
  "Sat": "T7",
  "Sun": "CN",
  "Week": "Tuần",
  "Week {0}": "Tuần {0}",
  "Day": "Ngày",
  "Workout": "Bài tập",
  "Workouts": "Bài tập",
  "Exercise": "Động tác",
  "Exercises": "Động tác",
  "Set": "Hiệp",
  "Sets": "Hiệp",
  "Rep": "Lần",
  "Reps": "Lần",
  "Rest": "Nghỉ",
  "Rest Interval": "Nghỉ giữa hiệp",
  "Duration": "Thời lượng",
  "Duration:": "Thời lượng:",
  "minutes": "phút",
  "Weight (kg)": "Mức Tạ (kg)",
  "Video": "Video",
  "Guide": "Hướng Dẫn",
  "Technique Video": "Video kỹ thuật",
  "Watch technique video": "Xem video kỹ thuật",
  "Close": "Đóng",
  "Cancel": "Hủy",
  "Confirm": "Xác nhận",
  "Save": "Lưu",
  "Search": "Tìm kiếm",
  "Filter": "Lọc",
  "Filter:": "Lọc:",
  "Reload list": "Tải lại danh sách",
  "Recently": "Gần đây",
  "Coach": "Huấn luyện viên",
  "Assigned Coach:": "Huấn luyện viên phụ trách:",
  "To be determined": "Chưa xác định",
  "classes": "lớp",
  "workouts": "bài",
  "sessions": "buổi",
  "exercises": "động tác",
  "weeks": "mốc tuần",

  // Member Workouts Modal
  "Workouts & Training Roadmaps": "Bài Tập & Lộ Trình Huấn Luyện",
  "Smart Categorization": "Phân loại thông minh",
  "Clearly separated between milestone-based training plans and one-time workout assignments.": "Tách biệt rõ ràng giữa kế hoạch tập luyện theo mốc tuần và các bài tập được giao 1 lần.",
  "Enrolled Classes": "Lớp Học Đã Đăng Ký",
  "Loading enrolled classes...": "Đang tải danh sách lớp học...",
  "You have no paid classes yet. Only confirmed classes display coach workouts!": "Bạn chưa có lớp học nào đã hoàn tất thanh toán. Chỉ những lớp đã thanh toán mới hiển thị bài tập từ HLV!",
  "All Classes": "Tất Cả Lớp Học",
  "View all received workout plans": "Xem toàn bộ giáo án đã nhận",
  "Class Workouts": "Giáo Án Thuộc Lớp",
  "All workouts across your registered classes": "Tổng hợp bài tập các lớp bạn đã đăng ký",
  "Workout Details": "Chi tiết bài tập",
  "Search by exercise, muscle group...": "Tìm theo tên bài tập, nhóm cơ...",
  "All ({0})": "Tất Cả ({0})",
  "Milestone Plans": "Kế Hoạch Theo Mốc",
  "One-time Workouts": "Bài Giao 1 Lần",
  "⭐ Milestone Plans": "⭐ Kế Hoạch Theo Mốc",
  "⚡ One-time Workouts": "⚡ Bài Giao 1 Lần",
  "Loading class workouts...": "Đang tải danh sách bài tập của lớp...",
  "No matching workouts found": "Không tìm thấy bài tập phù hợp",
  "No Milestone Training Plans Yet": "Chưa Có Kế Hoạch Tập Luyện Nào Theo Mốc",
  "No One-time Workouts Assigned Yet": "Chưa Có Bài Tập Nào Được Giao 1 Lần",
  "No Workouts Assigned Yet": "Chưa Có Bài Tập Nào Được Giao",
  "Try searching with different keywords or clear filter.": "Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc.",
  "Coach has not created a long-term milestone plan for you yet.": "Huấn luyện viên chưa tạo lộ trình dài hạn theo mốc tuần cho bạn.",
  "Workouts will automatically appear as soon as your coach assigns them!": "Giáo án sẽ tự động cập nhật ngay khi HLV gửi bài tập mới!",
  "{0}-Week Roadmap": "Lộ trình {0} tuần",
  "One-time Workout": "Bài tập 1 lần",
  "Goal:": "Mục tiêu:",
  "Notes from Coach:": "Lời dặn từ Huấn Luyện Viên:",
  "Select week milestone to view exercises:": "Chọn mốc tuần để xem bài tập:",
  "Workout Session": "Buổi tập",
  "Exercise / Movement": "Động Tác / Bài Tập",
  "Sets x Reps": "Sets x Reps",
  "Number of Sets": "Số Hiệp",
  "Number of Reps": "Số Lần (Reps)",
  "Rest Between Sets": "Nghỉ Giữa Hiệp",
  "Note:": "Ghi chú:",
  "sets": "hiệp",
  "reps": "lần",
  "No workout sessions in this week.": "Tuần này không có buổi tập nào.",
  "This plan does not have specific exercises yet.": "Giáo án chưa có động tác cụ thể.",
  "Milestone plans track long-term roadmaps, while one-time workouts are daily tasks.": "Kế hoạch tập luyện theo mốc giúp bạn theo dõi lộ trình dài hạn, trong khi bài tập 1 lần là nhiệm vụ hàng ngày.",
  "Roadmaps & workouts from coach.": "Lộ trình & bài tập từ HLV.",
  "View workouts for this class": "Xem bài tập lớp này",
  "View coach assessment for this class": "Xem đánh giá của HLV cho lớp này",
  "Assessments": "Đánh giá",

  // Muscle groups
  "Chest (Ngực)": "Chest (Ngực)",
  "Back (Lưng/Xô)": "Back (Lưng/Xô)",
  "Legs (Đùi/Bắp chân)": "Legs (Đùi/Bắp chân)",
  "Shoulders (Vai)": "Shoulders (Vai)",
  "Arms (Tay trước/Tay sau)": "Arms (Tay trước/Tay sau)",
  "Abs (Bụng/Core)": "Abs (Bụng/Core)",
  "Cardio / Full body": "Cardio / Toàn thân",
  "Chest": "Ngực",
  "Back": "Lưng",
  "Legs": "Chân/Đùi",
  "Shoulders": "Vai",
  "Arms": "Tay",
  "Abs": "Cơ bụng",
  "Cardio": "Cardio",
  "General": "Chung",

  // Coach Workout Plans Page
  "Workout & Training Plan Management": "Quản Lý Giáo Án & Kế Hoạch Tập Luyện",
  "Design weekly milestone plans or assign quick workouts for individuals and classes": "Thiết kế kế hoạch theo tuần/mốc hoặc giao bài tập nhanh cho cá nhân & cả lớp",
  "Add Exercise to Library": "Thêm Động Tác Vào Thư Viện",
  "Long-term Plans": "Kế Hoạch Dài Hạn",
  "roadmaps": "lộ trình",
  "Quick Assignments": "Bài Giao Nhanh",
  "Active Students": "Học Viên Đang Dạy",
  "students": "người",
  "Exercise Library": "Thư Viện Động Tác",
  "⭐ Create Plan by Week / Milestone": "⭐ Tạo Kế Hoạch Theo Tuần / Mốc",
  "Assign Quick Workout (1 Session)": "Giao Bài Tập Nhanh (1 Buổi)",
  "Plan & Workout List": "Danh Sách Kế Hoạch & Bài Tập",

  // Target Selection
  "Select Plan Target Audience": "Chọn Đối Tượng Áp Dụng Kế Hoạch",
  "1. Individual Plan (1 Student)": "1. Kế hoạch Cá Nhân (1 Học viên)",
  "Create dedicated roadmap optimized for an individual student.": "Lập lộ trình huấn luyện riêng biệt tối ưu theo thể trạng của 1 học viên.",
  "2. Class Plan": "2. Kế hoạch Cho Cả Lớp",
  "Apply synchronously to all students in the class you coach.": "Áp dụng đồng bộ cho tất cả học viên trong lớp bạn phụ trách.",
  "Select Student": "Chọn Học Viên",
  "-- Select student from list ({0} students) --": "-- Chọn học viên từ danh sách ({0} học viên) --",
  "Select Class": "Chọn Lớp Học",
  "-- Select class you coach ({0} classes) --": "-- Chọn lớp học bạn đang dạy ({0} lớp) --",
  "{0} enrolled students": "{0} học viên tham gia",

  // Training Plan Info
  "Plan Information & Objectives": "Thông Tin & Mục Tiêu Kế Hoạch",
  "Plan Title": "Tiêu Đề Kế Hoạch",
  "e.g. 4-Week Fat Loss & Lean Muscle Roadmap...": "VD: Lộ trình Giảm Mỡ - Tăng Cơ Nạc 4 Tuần...",
  "Training Goal": "Mục Tiêu Tập Luyện",
  "e.g. Lose 3kg fat, gain 1.5kg muscle, improve squat weight...": "VD: Giảm 3kg mỡ, tăng 1.5kg cơ, cải thiện mức tạ squat...",
  "Quick suggestions:": "Gợi ý nhanh:",
  "Weight Loss & Fat Burning": "Giảm cân & Đốt mỡ thừa",
  "Muscle Gain & Definition (Hypertrophy)": "Tăng cơ bắp & Cắt nét (Hypertrophy)",
  "Total Body Strength (Strength)": "Tăng sức mạnh toàn thân (Strength)",
  "Cardio & Stamina Improvement (Endurance)": "Cải thiện thể lực & Sức bền tim mạch (Endurance)",
  "Muscle Recovery & Flexibility": "Phục hồi cơ bắp & Tăng độ linh hoạt",
  "Plan Duration (Weeks)": "Số Mốc Tuần Của Kế Hoạch",
  "{0} Weeks": "{0} Tuần",
  "(Most popular)": "(Phổ biến nhất)",
  "Start Date": "Ngày Bắt Đầu",
  "End Date": "Ngày Kết Thúc",
  "General Notes & Nutrition Advice": "Ghi Chú Chung & Dặn Dò Dinh Dưỡng",
  "e.g. Drink 2L water daily, sleep 7-8 hours, warm up 10 mins before training...": "VD: Uống đủ 2L nước mỗi ngày, ngủ đủ 7-8 tiếng, khởi động kỹ 10 phút trước khi tập...",

  // Milestone Builder
  "Build Weekly Milestones in Detail": "Xây Dựng Chi Tiết Từng Mốc Tuần",
  "Select a week to organize exercises by day of the week.": "Chọn tuần để soạn thảo bài tập theo từng thứ trong tuần.",
  "Copy Week 1 schedule to all other weeks": "Sao chép cấu trúc buổi tập của Tuần 1 sang tất cả các tuần khác",
  "Copy Week 1 ➔ All Weeks": "Sao Chép Tuần 1 ➔ Tất Cả Tuần",
  "Week Milestone {0}": "Mốc Tuần {0}",
  "{0} sessions": "{0} buổi",
  "Week {0} Schedule ({1} sessions selected)": "Lịch tập Tuần {0} ({1} buổi tập được chọn)",
  "Click on weekdays below to enable/disable workout days": "Bấm vào các thứ bên dưới để Bật/Tắt ngày tập",
  "{0} exercises": "{0} bài tập",
  "Muscle group / session name (e.g. Chest & Triceps)": "Tên nhóm cơ / buổi tập (VD: Ngực & Tay sau)",
  "Switch to rest day": "Chuyển thành ngày nghỉ",
  "-- Select exercise --": "-- Chọn bài tập --",
  "Demo video": "Video mẫu",
  "Rest (s)": "Nghỉ (s)",
  "Exercise note": "Ghi chú động tác",
  "e.g. Keep back straight, squeeze chest...": "VD: Giữ lưng thẳng, siết ngực...",
  "Delete exercise": "Xóa động tác",
  "+ Add exercise for {0}": "+ Thêm bài tập cho {0}",
  "No workout sessions this week. Click weekdays above to enable.": "Tuần này chưa có buổi tập nào. Hãy bấm vào các thứ ở trên để bật ngày tập.",
  "Students will receive roadmap notifications via the application.": "Học viên sẽ nhận được thông báo lộ trình kế hoạch tập luyện qua ứng dụng.",
  "Initializing plan...": "Đang khởi tạo kế hoạch...",
  "Confirm Create Training Plan": "Xác Nhận Tạo Kế Hoạch Tập Luyện",

  // Single Workout Assignment
  "Choose Assignment Scope": "Chọn Phạm Vi Giao Bài",
  "1. Assign to 1 Individual": "1. Giao bài cho 1 Cá nhân",
  "Select exactly 1 student to send a customized training plan.": "Chọn chính xác 1 học viên để gửi giáo án huấn luyện riêng biệt.",
  "2. Assign to Entire Class": "2. Giao bài cho Toàn Lớp",
  "Automatically create workout plan & send notifications to all students in the selected class.": "Tự động tạo giáo án & gửi thông báo cho tất cả học viên trong lớp được chọn.",
  "Select Student to Receive Workout": "Chọn Học Viên Nhận Bài Tập",
  "-- Select student from list ({0}) --": "-- Chọn học viên từ danh sách ({0}) --",
  "-- Select class you coach ({0}) --": "-- Chọn lớp học bạn phụ trách ({0}) --",
  "Workout Information & Instructions": "Thông Tin & Hướng Dẫn Buổi Tập",
  "Workout Title": "Tiêu Đề Giáo Án",
  "e.g. Day 1 Plan - Chest & Triceps, Homework workout...": "VD: Giáo án ngày 1 - Ngực & Tay sau, Bài tập về nhà...",
  "Additional Instructions & Notes": "Ghi Chú Hướng Dẫn Thêm",
  "e.g. Warm up 10 minutes before starting, drink plenty of water...": "VD: Khởi động 10 phút trước khi bắt đầu, uống nhiều nước...",
  "Required Exercise List": "Danh Sách Bài Tập Cần Thực Hiện",
  "Add Movement": "Thêm Động Tác",
  "Exercise Name": "Tên Động Tác",
  "-- Select exercise from library --": "-- Chọn bài tập từ thư viện --",
  "Watch demo technique video": "Xem video hướng dẫn mẫu",
  "Reps per Set": "Số Lần/Hiệp (Reps)",
  "Rest (Seconds)": "Nghỉ (Giây)",
  "Delete exercise row": "Xóa dòng động tác",
  "Sending will simultaneously push notifications to student accounts.": "Nhấn gửi sẽ đồng thời tạo thông báo đẩy tới tài khoản của học viên.",
  "Processing & Sending...": "Đang xử lý & Gửi...",
  "Confirm Assign Workout & Notify": "Xác Nhận Gửi Giáo Án & Thông Báo",

  // History & Filters
  "Milestone Training Plans ({0})": "Kế hoạch tập luyện theo mốc ({0})",
  "One-time Workouts ({0})": "Bài tập giao 1 lần ({0})",
  "⭐ Milestone Training Plans ({0})": "⭐ Kế hoạch tập luyện theo mốc ({0})",
  "⚡ One-time Workouts ({0})": "⚡ Bài tập giao 1 lần ({0})",
  "All students": "Tất cả học viên",
  "Loading list...": "Đang tải danh sách...",
  "No matching plans or workouts found": "Chưa có kế hoạch hoặc bài tập nào phù hợp",
  "Please select the 'Create Plan by Week / Milestone' tab to create a roadmap.": "Hãy chọn tab 'Tạo Kế Hoạch Theo Tuần / Mốc' để tạo lộ trình cho học viên.",
  "{0}-week plan": "Kế hoạch {0} tuần",
  "One-time workout": "Bài tập 1 lần",
  "Student:": "Học viên:",
  "{0} week milestones": "{0} mốc tuần",
  "Exercise count:": "Số bài tập:",
  "View details by milestone": "Xem chi tiết theo mốc",

  // Detail Modal & Exercises
  "Assigned to:": "Giao cho:",
  "Goal": "Mục Tiêu",
  "Not set": "Chưa thiết lập",
  "Roadmap Duration": "Thời Hạn Lộ Trình",
  "Coach's Note:": "Ghi chú của Coach:",
  "View Details by Week Milestone:": "Xem Chi Tiết Theo Mốc Tuần:",
  "Impacted muscle:": "Cơ tác động:",
  "Exercise List ({0})": "Danh Sách Bài Tập ({0})",

  // Add Exercise Modal
  "Add New Exercise": "Thêm Động Tác Mới",
  "Add to library for repeated use": "Thêm vào thư viện để sử dụng lại nhiều lần",
  "e.g. Bench Press, Plank, Deadlift...": "VD: Bench Press, Plank, Deadlift...",
  "Target Muscle Group": "Nhóm Cơ Tác Động",
  "Youtube Demo Video Link (Optional)": "Link Video Youtube Mẫu (Tùy chọn)",
  "Save to Library": "Lưu Vào Thư Viện",

  // Action Banners & Confirmations
  "Unable to load workout plan data.": "Không thể tải dữ liệu giáo án bài tập.",
  "Plan must contain at least 1 exercise.": "Giáo án phải có ít nhất 1 bài tập.",
  "Please enter a title for the workout plan.": "Vui lòng nhập tiêu đề giáo án bài tập.",
  "Please select a student to assign the workout.": "Vui lòng chọn 1 học viên để giao bài.",
  "Please select a class to assign the workout to the entire class.": "Vui lòng chọn 1 lớp học để giao bài cho toàn bộ lớp.",
  "Please select an exercise for row {0}.": "Vui lòng chọn bài tập cho dòng số {0}.",
  "Workout assigned and notification sent successfully!": "Giao bài tập và gửi thông báo thành công!",
  "An error occurred while assigning workout.": "Có lỗi xảy ra khi giao bài tập.",
  "Copied Week 1 schedule to all remaining weeks!": "Đã sao chép toàn bộ lịch tập của Tuần 1 sang tất cả các tuần còn lại!",
  "A workout session must have at least 1 exercise. Uncheck the day if it is a rest day.": "Buổi tập cần có ít nhất 1 bài tập. Nếu muốn nghỉ ngày này, hãy bỏ chọn ngày tập.",
  "Please enter a title for the training plan.": "Vui lòng nhập tiêu đề kế hoạch tập luyện.",
  "Please select a student to apply the plan.": "Vui lòng chọn 1 học viên để áp dụng kế hoạch.",
  "Please select a class to apply the plan to the entire class.": "Vui lòng chọn 1 lớp học để áp dụng kế hoạch cho cả lớp.",
  "Week {0} - {1}: Please select an exercise for row {2} or delete it.": "Tuần {0} - {1}: Vui lòng chọn bài tập cho dòng số {2} hoặc xóa dòng đó.",
  "The plan must have at least 1 exercise. Please enable at least 1 workout day and select exercises.": "Kế hoạch phải có ít nhất 1 bài tập. Vui lòng bật ít nhất 1 ngày tập và chọn bài tập.",
  "Training plan created successfully!": "Tạo kế hoạch tập luyện thành công!",
  "An error occurred while creating training plan.": "Có lỗi xảy ra khi tạo kế hoạch.",
  "Added exercise \"{0}\" to library!": "Đã thêm bài tập \"{0}\" vào thư viện!",
  "Unable to create new exercise.": "Không thể tạo bài tập mới.",
  "Are you sure you want to delete this workout/training plan?": "Bạn có chắc chắn muốn xóa giáo án / kế hoạch này không?",
  "Deleted successfully.": "Đã xóa thành công.",
  "Unable to delete.": "Không thể xóa."
};

for (const [en, vi] of Object.entries(receptionistDictionary)) {
  translations[en] = [en, vi];
  translations[vi] = [en, vi];
}

for (const [en, vi] of Object.entries(workoutDictionary)) {
  translations[en] = [en, vi];
  translations[vi] = [en, vi];
}

const teachingSlotTranslations = {
  'Teaching slot settings':'Cấu hình ca học',
  '90 minutes per session':'90 phút mỗi buổi',
  'Opening time':'Giờ mở cửa', 'Closing time':'Giờ đóng cửa',
  'Changeover (minutes)':'Thời gian chuyển ca (phút)',
  'Save settings':'Lưu cấu hình', 'Current saved slots':'Các ca đã lưu',
  'Teaching slot':'Ca học','Existing session':'Buổi học hiện có','minutes changeover':'phút chuyển ca',
  'Each teaching slot lasts 90 minutes. Changeover time is reserved after each session.':'Mỗi ca học kéo dài 90 phút. Thời gian chuyển ca được giữ sau mỗi buổi.',
  'Changes apply to new or rescheduled sessions only. Existing sessions keep their times and reserved changeover.':'Thay đổi chỉ áp dụng cho buổi mới hoặc đổi lịch. Buổi hiện có giữ nguyên giờ và thời gian chuyển ca.',
  'Settings saved. Reopen scheduling forms to load the new slots.':'Đã lưu. Mở lại biểu mẫu tạo lịch để tải các ca mới.',
  'Unable to load teaching slots. Reload this page.':'Không tải được ca học. Vui lòng tải lại trang.',
  'Invalid operating hours or changeover time.':'Giờ hoạt động hoặc thời gian chuyển ca không hợp lệ.',
  'Choose a configured 90-minute teaching slot.':'Vui lòng chọn ca học 90 phút đã cấu hình.',
  'Scheduling settings changed. Reload the fixed teaching slots.':'Cấu hình lịch đã thay đổi. Vui lòng tải lại ca học.',
  'The system selects configured 90-minute teaching slots and reserves changeover time. Existing coach and room schedules remain blocked.':'Hệ thống chọn ca 90 phút đã cấu hình và giữ thời gian chuyển ca. Lịch phòng và huấn luyện viên hiện có vẫn được kiểm tra.',
  'All sessions and current teaching slots are checked again when saving; one conflict prevents the entire batch.':'Mọi buổi và ca học được kiểm tra lại khi lưu; một xung đột sẽ chặn toàn bộ chuỗi.'
};
for(const [en,vi] of Object.entries(teachingSlotTranslations)){translations[en]=[en,vi];translations[vi]=[en,vi];}

translations['Choose a teaching slot on {0} for {1}']=['Choose a teaching slot on {0} for {1}','Chọn ca học ngày {0} cho {1}'];

const courseScheduleTranslations={
'Schedule course':'Xếp lịch khóa học',
'Add supplementary session':'Thêm buổi bổ sung',
'Choose weekly slots once. Review the whole course before saving.':'Chọn thứ và slot cố định mỗi tuần, kiểm tra cả khóa trước khi lưu.',
'Schedule the full course before accepting registrations. Use supplementary sessions for make-up lessons afterwards.':'Xếp đủ lịch khóa học trước khi nhận đăng ký. Sau đó dùng buổi bổ sung khi cần học bù.',
'Course start date':'Ngày bắt đầu khóa học',
'Total course sessions':'Tổng số buổi của khóa',
'Weekly teaching slots':'Thứ học và slot mỗi tuần',
'Slot for {0}':'Slot cho {0}',
'Weekly slots stay fixed. Conflicts require your decision; times never change automatically.':'Giữ cố định slot mỗi tuần. Nếu trùng lịch, quản lý chọn cách xử lý; hệ thống không tự đổi giờ.',
'Expected course end':'Ngày kết thúc dự kiến',
'Resolve conflicts or adjust the weekly rules before saving.':'Hãy xử lý buổi trùng lịch hoặc chỉnh quy tắc tuần trước khi lưu.',
'Choose a make-up session':'Chọn ca hoặc ngày học bù',
'Select an alternative':'Chọn phương án thay thế',
'No suggested alternative in the next 7 days. Change the weekly rules or excluded dates.':'Không có phương án phù hợp trong 7 ngày tiếp theo. Hãy chỉnh lịch tuần hoặc ngày nghỉ.',
'Make-up for {0}':'Học bù cho ngày {0}',
'Confirm course schedule':'Xác nhận lịch khóa học',
'Selected slot conflicts with the coach or room.':'Slot đã chọn bị trùng lịch huấn luyện viên hoặc phòng.',
'Two lessons cannot share the same date.':'Không thể xếp hai buổi của cùng lớp trong một ngày.',
'Choose one configured slot for each selected weekday.':'Chọn một slot hợp lệ cho mỗi thứ học.',
'Make-up sessions must use a future non-excluded date inside the planning range.':'Buổi học bù phải trong tương lai, trong khoảng xếp lịch và không trùng ngày nghỉ.',
'Only planned lessons can be overridden.':'Chỉ được đổi những buổi thuộc lịch khóa học.',
'The weekly plan changed or contains conflicts. Generate a new preview.':'Lịch khóa học đã thay đổi hoặc bị trùng. Vui lòng xem trước lại.'
};
for(const [en,vi] of Object.entries(courseScheduleTranslations)){translations[en]=[en,vi];translations[vi]=[en,vi];}
const slotAvailabilityTranslations={
'Select a class, start date and session count to check slots.':'Chọn lớp, ngày bắt đầu và số buổi để kiểm tra slot.',
'Availability checked across the entire course.':'Đã kiểm tra slot trên toàn bộ khóa học.',
'Checking slots across the entire course…':'Đang kiểm tra slot trên toàn bộ khóa học…',
'Unable to check slot availability.':'Không thể kiểm tra slot trống. Vui lòng mở lại form hoặc thay đổi thông tin để thử lại.',
'Allow slots that require make-up sessions':'Cho phép chọn slot có buổi cần học bù',
'No lessons on this weekday':'Không có buổi học vào thứ này',
'Conflicts: {0}/{1}':'Trùng {0}/{1} buổi',
'Free for the whole course':'Trống toàn khóa',
'Coach or room occupied on:':'Huấn luyện viên hoặc phòng bận ngày:',
'Choose another slot.':'Hãy chọn slot khác.',
'Make-up sessions must be resolved before saving.':'Phải xếp buổi học bù trước khi lưu.'
};
for(const [en,vi] of Object.entries(slotAvailabilityTranslations)){translations[en]=[en,vi];translations[vi]=[en,vi];}

const courseReviewTranslations={
'Course overview':'Tổng quan khóa học',
'Course dates':'Thời gian khóa học',
'{0} sessions need attention':'{0} buổi cần xử lý',
'{0}/{1} sessions ready':'{0}/{1} buổi hợp lệ — có thể xác nhận',
'Sessions needing attention':'Buổi cần xử lý',
'Weekly course schedule':'Lịch học theo tuần',
'Week {0}':'Tuần {0}',
'Day off':'Nghỉ',
'Conflict':'Trùng lịch',
'Scheduling steps':'Các bước xếp lịch',
'Set up schedule':'Thiết lập lịch',
'Review and confirm':'Kiểm tra và xác nhận',
'Back to schedule settings':'Quay lại chỉnh lịch',
'Preview course schedule':'Xem trước lịch khóa học',
'Confirm {0} sessions':'Xác nhận {0} buổi'
};
for(const [en,vi] of Object.entries(courseReviewTranslations)){translations[en]=[en,vi];translations[vi]=[en,vi];}

translations['Photo']=['Photo','Ảnh minh họa'];
translations['Ảnh minh họa']=['Photo','Ảnh minh họa'];

const coachSubjectTranslations={
'Teaching subjects':'Bộ môn giảng dạy',
'Only assigned subjects can be selected when assigning this coach to a class.':'HLV chỉ được phân công vào lớp thuộc các bộ môn đã chọn. Có thể chọn nhiều bộ môn.',
'Create subjects in Center Operations first.':'Hãy tạo bộ môn trong Vận hành trung tâm trước.',
'No coaches are assigned to this subject. Assign teaching subjects in Staff & Roles first.':'Chưa có HLV được phân công cho bộ môn này. Hãy thiết lập bộ môn giảng dạy tại Nhân sự và phân quyền.',
'The selected coach is not assigned to this subject.':'HLV đã chọn chưa được phân công giảng dạy bộ môn này.',
"Reassign or deactivate active classes before removing their coach's subject.":'Hãy bàn giao hoặc ngừng hoạt động các lớp liên quan trước khi gỡ bộ môn của HLV.'
};
for(const [en,vi] of Object.entries(coachSubjectTranslations)){translations[en]=[en,vi];translations[vi]=[en,vi];}

const subjectSlotTranslations={
'Subject teaching slots':'Ca học của bộ môn',
'Session duration (minutes)':'Thời lượng mỗi buổi (phút)',
'Classes inherit these slots. Saved sessions keep their original times.':'Các lớp thuộc bộ môn kế thừa ca học này. Buổi đã lưu giữ nguyên giờ cũ.',
'Slot start time':'Giờ bắt đầu slot',
'Add slot':'Thêm slot',
'Generate slots from operating hours':'Tạo slot theo giờ hoạt động',
'Use automatic slots':'Dùng slot tự động',
'Automatic slots follow opening time, session duration and changeover.':'Slot tự động được tính theo giờ mở cửa, thời lượng và thời gian chuyển ca.',
'Remove slot {0}':'Xóa slot {0}',
'Choose a duration from 15 to 240 minutes.':'Chọn thời lượng từ 15 đến 240 phút.',
'Duration and slots are configured per subject':'Thời lượng và slot được cấu hình tại bộ môn',
'{0} minutes per session':'{0} phút mỗi buổi',
'Choose a configured teaching slot for this subject.':'Hãy chọn slot đúng theo cấu hình ca học của bộ môn.',
'Subject slots must fit operating hours and cannot overlap, including changeover.':'Slot của bộ môn phải nằm trong giờ hoạt động và không chồng lấn, kể cả thời gian chuyển ca.'
};
for(const [en,vi] of Object.entries(subjectSlotTranslations)){translations[en]=[en,vi];translations[vi]=[en,vi];}

translations['Inherited subject timetable']=['Inherited subject timetable','Kế thừa ca học của bộ môn'];


// Payment first-come first-served translations
translations['In Cart - Pay Now'] = ['In Cart - Pay Now', 'Trong giỏ · Thanh toán ngay'];
translations['Trong giỏ · Thanh toán ngay'] = ['In Cart - Pay Now', 'Trong giỏ · Thanh toán ngay'];
translations['Trong giỏ hàng · Thanh toán ngay'] = ['In Cart - Pay Now', 'Trong giỏ · Thanh toán ngay'];
translations['Seat reserved upon payment'] = ['Seat reserved upon payment', 'Giữ chỗ sau khi thanh toán'];
translations['Giữ chỗ sau khi thanh toán'] = ['Seat reserved upon payment', 'Giữ chỗ sau khi thanh toán'];
translations['Chưa giữ chỗ. Suất học xác nhận sau khi thanh toán.'] = ['Seat reserved upon payment', 'Giữ chỗ sau khi thanh toán'];
translations['Courses in cart are first-come, first-served. Complete payment to secure your spot.'] = ['Courses in cart are first-come, first-served. Complete payment to secure your spot.', 'Suất học ưu tiên người hoàn tất thanh toán trước. Vui lòng thanh toán sớm để đảm bảo vị trí.'];
translations['Suất học ưu tiên người hoàn tất thanh toán trước. Vui lòng thanh toán sớm để đảm bảo vị trí.'] = ['Courses in cart are first-come, first-served. Complete payment to secure your spot.', 'Suất học ưu tiên người hoàn tất thanh toán trước. Vui lòng thanh toán sớm để đảm bảo vị trí.'];
translations['Only the assigned coach can record attendance. Enrolled members are confirmed upon payment.'] = ['Only the assigned coach can record attendance. Enrolled members are confirmed upon payment.', 'Chỉ huấn luyện viên được phân công mới có thể điểm danh. Danh sách học viên được xác nhận sau khi thanh toán.'];
translations['Chỉ huấn luyện viên được phân công mới có thể điểm danh. Danh sách học viên được xác nhận sau khi thanh toán.'] = ['Only the assigned coach can record attendance. Enrolled members are confirmed upon payment.', 'Chỉ huấn luyện viên được phân công mới có thể điểm danh. Danh sách học viên được xác nhận sau khi thanh toán.'];
translations['Checkout failed! The class is now fully booked by others.'] = ['Checkout failed! The class is now fully booked by others.', 'Thanh toán không thành công! Lớp học vừa được người khác thanh toán trước nên đã hết chỗ.'];
translations['Thanh toán không thành công! Lớp học vừa được người khác thanh toán trước nên đã hết chỗ.'] = ['Checkout failed! The class is now fully booked by others.', 'Thanh toán không thành công! Lớp học vừa được người khác thanh toán trước nên đã hết chỗ.'];
translations['This course is already in your cart. Please go to checkout to complete payment.'] = ['This course is already in your cart. Please go to checkout to complete payment.', 'Khóa học này đã có trong giỏ hàng của bạn. Vui lòng vào giỏ hàng để hoàn tất thanh toán.'];
translations['Khóa học này đã có trong giỏ hàng của bạn. Vui lòng vào giỏ hàng để hoàn tất thanh toán.'] = ['This course is already in your cart. Please go to checkout to complete payment.', 'Khóa học này đã có trong giỏ hàng của bạn. Vui lòng vào giỏ hàng để hoàn tất thanh toán.'];

// Receptionist cart / pending payment translations
translations['Cart / Pending Payment'] = ['Cart / Pending Payment', 'Giỏ hàng · Chờ thanh toán'];
translations['Giỏ hàng · Chờ thanh toán'] = ['Cart / Pending Payment', 'Giỏ hàng · Chờ thanh toán'];
translations['Seats not reserved · Pay at counter to confirm enrollment'] = ['Seats not reserved · Pay at counter to confirm enrollment', 'Chưa giữ chỗ · Thanh toán tại quầy để xác nhận vào lớp'];
translations['Chưa giữ chỗ · Thanh toán tại quầy để xác nhận vào lớp'] = ['Seats not reserved · Pay at counter to confirm enrollment', 'Chưa giữ chỗ · Thanh toán tại quầy để xác nhận vào lớp'];
translations['Pay at Counter'] = ['Pay at Counter', 'Thanh toán tại quầy'];
translations['Thanh toán tại quầy'] = ['Pay at Counter', 'Thanh toán tại quầy'];
translations['In Cart'] = ['In Cart', 'Trong giỏ hàng'];
translations['Trong giỏ hàng'] = ['In Cart', 'Trong giỏ hàng'];
translations['Remove from Cart'] = ['Remove from Cart', 'Xóa khỏi giỏ hàng'];
translations['Xóa khỏi giỏ hàng'] = ['Remove from Cart', 'Xóa khỏi giỏ hàng'];
translations['Collect payment at counter and confirm enrollment'] = ['Collect payment at counter and confirm enrollment', 'Thu tiền tại quầy và xác nhận vào lớp'];
translations['Thu tiền tại quầy và xác nhận vào lớp'] = ['Collect payment at counter and confirm enrollment', 'Thu tiền tại quầy và xác nhận vào lớp'];
translations['Upcoming scheduled sessions below 25% capacity. Only confirmed paid bookings count as reserved seats.'] = ['Upcoming scheduled sessions below 25% capacity. Only confirmed paid bookings count as reserved seats.', 'Buổi sắp tới có dưới 25% sức chứa được đăng ký. Chỉ lượt đăng ký đã hoàn tất thanh toán mới giữ chỗ.'];
translations['Buổi sắp tới có dưới 25% sức chứa được đăng ký. Chỉ lượt đăng ký đã hoàn tất thanh toán mới giữ chỗ.'] = ['Upcoming scheduled sessions below 25% capacity. Only confirmed paid bookings count as reserved seats.', 'Buổi sắp tới có dưới 25% sức chứa được đăng ký. Chỉ lượt đăng ký đã hoàn tất thanh toán mới giữ chỗ.'];
translations['Full Course:'] = ['Full Course:', 'Toàn bộ khóa:'];
translations['Toàn bộ khóa:'] = ['Full Course:', 'Toàn bộ khóa:'];

// Support Desk & Cancellation Module Translations
const supportTranslations = [
  ["Class Cancellation & Refund Policy","Chính sách Hủy Lớp & Hoàn Bảo Lưu"],
  ["Checking policy terms...","Đang kiểm tra điều khoản chính sách..."],
  ["Evaluating class schedule & credit terms...","Đang đánh giá tiến độ lớp & giá trị tín dụng..."],
  ["Failed to load cancellation policy preview.","Không thể tải thông tin chính sách hủy lớp."],
  ["Class Cancelled & 100% Credit Granted!","Đã hủy lớp & Nhận 100% Voucher Tín dụng!"],
  ["Because this class has not started yet, 100% of your course fee has been converted into a Course Credit Voucher valid for 60 days.","Vì lớp học chưa diễn ra, 100% học phí đã được chuyển đổi thành Voucher tín dụng khóa học có giá trị trong 60 ngày."],
  ["Credit Voucher Code","Mã Voucher Tín Dụng"],
  ["Copied","Đã sao chép"],
  ["Copy","Sao chép"],
  ["Valid Until:","Hạn sử dụng:"],
  ["Expires:","Hết hạn:"],
  ["Support Ticket Submitted!","Đã gửi Phiếu Hỗ Trợ!"],
  ["Ticket ID","Mã phiếu"],
  ["You will receive a notification once Reception reviews and resolves your ticket.","Bạn sẽ nhận được thông báo ngay khi Lễ tân duyệt và phản hồi yêu cầu."],
  ["View My Credits & Tickets","Xem Ví Voucher & Phiếu Hỗ Trợ"],
  ["Class Has Not Started Yet - 100% Credit Eligible","Lớp chưa diễn ra - Đủ điều kiện nhận 100% Credit"],
  ["Class In Progress - Reception Support Required","Lớp đang diễn ra - Cần Lễ tân duyệt bảo lưu"],
  ["Course Name","Tên khóa học"],
  ["Course Tuition","Học phí khóa học"],
  ["Session Progress","Tiến độ khóa học"],
  ["sessions taken","buổi đã học"],
  ["remaining","buổi còn lại"],
  ["Estimated Prorated Credit Value:","Ước tính giá trị bảo lưu còn lại:"],
  ["Terms & Guarantee:","Điều khoản & Cam kết:"],
  ["100% of your course price will be credited as a 60-day voucher.","100% học phí sẽ được cấp dưới dạng Voucher tín dụng thời hạn 60 ngày."],
  ["Use the voucher at checkout for any other class or gym membership.","Sử dụng Voucher khi thanh toán cho bất kỳ lớp học hoặc gói tập khác."],
  ["All upcoming sessions will be released for other members.","Tất cả các buổi học sắp tới sẽ được nhường cho hội viên khác."],
  ["Keep My Booking","Giữ lại lịch học"],
  ["Confirm Cancel & Receive Credit","Xác nhận hủy & Nhận Credit ngay"],
  ["Reason for Request","Lý do yêu cầu"],
  ["Mid-Course Emergency / Medical / Relocation","Đột xuất giữa khóa / Sức khỏe / Đổi chỗ ở"],
  ["Schedule Conflict / Need Class Transfer","Trùng lịch học / Cần đổi lớp khác"],
  ["Course Quality / Other Reason","Chất lượng lớp học / Lý do khác"],
  ["Detailed Situation & Note for Receptionist","Mô tả chi tiết & Ghi chú cho Lễ tân"],
  ["Please specify your reason (e.g. medical reason, work relocation). Receptionist will review and approve your credit voucher or compensation.","Vui lòng nêu rõ lý do (ví dụ: lý do sức khỏe, chuyển công tác). Lễ tân sẽ xem xét duyệt cấp voucher tín dụng hoặc gói bồi hoàn."],
  ["Send Request to Reception","Gửi yêu cầu tới Lễ tân"],
  ["Help Center & Credit Wallet","Trung Tâm Hỗ Trợ & Ví Tín Dụng"],
  ["Manage course cancellation credit vouchers and submit support requests to Reception.","Quản lý mã tín dụng hoàn hủy lớp và gửi yêu cầu hỗ trợ tới Lễ tân."],
  ["New Support Ticket","Gửi Phiếu Hỗ Trợ Mới"],
  ["Course Credit Vouchers","Voucher Tín Dụng Khóa Học"],
  ["My Support Requests","Phiếu Yêu Cầu Của Tôi"],
  ["Policy Tip:","Mẹo chính sách:"],
  ["Credit Vouchers are issued when a class is cancelled before start (100% value) or approved by Reception for mid-course retention. Apply them at Cart Checkout to deduct up to 100% of your new class fee.","Mã tín dụng được cấp khi hủy lớp trước khai giảng (100%) hoặc được Lễ tân duyệt bảo lưu. Áp dụng tại Giỏ hàng để giảm trừ tới 100% học phí mới."],
  ["No Credit Vouchers Yet","Chưa có Mã Tín Dụng nào"],
  ["When you cancel an eligible class or receive a resolution from Reception, your credit vouchers will appear here.","Khi bạn hủy lớp hợp lệ hoặc nhận được hỗ trợ từ Lễ tân, mã tín dụng sẽ xuất hiện ở đây."],
  ["READY TO USE","SẴN SÀNG SỬ DỤNG"],
  ["Course Credit","Tín dụng khóa học"],
  ["days left","ngày còn lại"],
  ["No Support Tickets Submitted","Chưa có phiếu hỗ trợ nào"],
  ["Need help with class retention, facility reports, or feedback? Click \"New Support Ticket\" to contact Reception.","Cần hỗ trợ bảo lưu lớp, báo hỏng CSVC hoặc góp ý? Nhấn \"Gửi Phiếu Hỗ Trợ Mới\" để liên hệ Lễ tân."],
  ["Pending Reception Review","Chờ Lễ tân tiếp nhận"],
  ["Approved & Resolved","Đã duyệt & Giải quyết"],
  ["Escalated to Manager","Đã chuyển Quản lý duyệt"],
  ["Class Cancellation & Proration","Hủy & Bảo lưu lớp học"],
  ["Facility & Equipment Report","Báo sự cố thiết bị & CSVC"],
  ["Coach & Training Feedback","Góp ý HLV & Huấn luyện"],
  ["Service Complaint","Khiếu nại dịch vụ"],
  ["General Inquiry","Hỏi đáp chung"],
  ["Your Request Description","Nội dung yêu cầu của bạn"],
  ["Associated Class","Lớp học liên quan"],
  ["Reception Response","Phản hồi từ Lễ tân"],
  ["Ticket is currently in queue. Reception staff will respond shortly.","Phiếu đang trong hàng đợi xử lý. Nhân viên Lễ tân sẽ phản hồi sớm nhất."],
  ["Submit New Support Ticket","Tạo Phiếu Hỗ Trợ Mới"],
  ["Send inquiries or facility reports directly to Reception.","Gửi thắc mắc hoặc báo cáo cơ sở vật chất trực tiếp tới Lễ tân."],
  ["Related Class (Optional)","Lớp học liên quan (Không bắt buộc)"],
  ["None / Not related to a specific class","Không / Không liên quan lớp học cụ thể"],
  ["Brief summary of your issue or request","Tóm tắt vấn đề hoặc yêu cầu của bạn"],
  ["Detailed Content","Nội dung chi tiết"],
  ["Please provide as much detail as possible so Reception can assist you accurately...","Vui lòng mô tả chi tiết để Lễ tân có thể hỗ trợ bạn chính xác nhất..."],
  ["Submit Ticket","Gửi phiếu yêu cầu"],
  ["Apply Course Credit Voucher","Áp dụng Voucher Tín Dụng Khóa Học"],
  ["available","khả dụng"],
  ["Do not use credit voucher","Không sử dụng voucher tín dụng"],
  ["Voucher applied:","Voucher đã áp dụng:"],
  ["Credit Voucher","Voucher tín dụng"],
  ["Member Tier Discount","Giảm giá hạng hội viên"],
  ["Help & Support","Hỗ Trợ & Bảo Lưu"],
  ["Help & Support Desk","Quầy Hỗ Trợ & Bảo Lưu"],
  ["Reception Support Desk & Cancellations","Quầy Lễ Tân: Tiếp Nhận Hỗ Trợ & Hủy Lớp"],
  ["Review mid-course class cancellation requests, issue credit vouchers, and address member facility inquiries.","Xem xét yêu cầu hủy lớp giữa khóa, cấp voucher tín dụng và xử lý báo cáo CSVC của hội viên."],
  ["Refresh Queue","Làm mới hàng đợi"],
  ["Pending Review","Chờ duyệt"],
  ["Cancellation Requests","Yêu cầu hủy lớp"],
  ["Facilities & Feedback","Báo CSVC & Góp ý"],
  ["Resolved Tickets","Đơn đã giải quyết"],
  ["Search member name, phone, title...","Tìm theo tên, SĐT, tiêu đề..."],
  ["All Statuses","Tất cả trạng thái"],
  ["All Categories","Tất cả phân loại"],
  ["Class Cancellation","Hủy lớp học"],
  ["Facility Issue","Sự cố CSVC"],
  ["Coach Feedback","Góp ý HLV"],
  ["Complaint","Khiếu nại"],
  ["Member Info","Hội viên"],
  ["Category & Title","Phân loại & Tiêu đề"],
  ["Class & Proration","Lớp học & Bảo lưu"],
  ["Submitted","Ngày gửi"],
  ["Review & Resolve","Xử lý đơn"],
  ["Resolve Support Ticket","Giải Quyết Phiếu Hỗ Trợ"],
  ["Member Request Description","Nội dung hội viên yêu cầu"],
  ["Enrolled Course Information","Thông tin khóa học đã đăng ký"],
  ["Total Fee","Tổng học phí"],
  ["Total Sessions","Tổng số buổi"],
  ["Attended","Đã tham gia"],
  ["Remaining","Còn lại"],
  ["Prorated Remaining Value (Recommended Credit):","Giá trị số buổi còn lại (Đề xuất cấp Credit):"],
  ["Select Resolution Action","Chọn Phương Án Xử Lý"],
  ["Issue Credit Voucher (Recommended)","Cấp Voucher Tín Dụng (Khuyến nghị)"],
  ["Generates 60-day voucher code for member to re-enroll without losing money.","Tạo mã voucher 60 ngày để hội viên đăng ký lại khóa học mà không bị mất tiền."],
  ["Grant Free 1-Month Gym Pass","Tặng Thêm 1 Tháng Tập Gym Miễn Phí"],
  ["Alternative perk when student prefers gym workouts over class credit.","Quyền lợi thay thế khi học viên muốn chuyển sang tập Gym tự do."],
  ["Approve & Resolve Issue","Phê Duyệt & Giải Quyết Vấn Đề"],
  ["Acknowledge repair, feedback or inquiry as fully resolved.","Xác nhận sự cố/CSVC/góp ý đã được khắc phục hoàn tất."],
  ["Escalate to Center Manager","Chuyển Quản Lý Trung Tâm Giải Quyết"],
  ["For special cash refunds or high-dispute exceptions.","Dành cho trường hợp đòi hoàn tiền mặt hoặc tranh chấp đặc biệt."],
  ["Reject Request","Từ Chối Yêu Cầu"],
  ["Course completed >80% or violates center policies.","Đã học quá 80% thời lượng hoặc vi phạm nội quy trung tâm."],
  ["Voucher Credit Amount (VND)","Số tiền cấp Voucher tín dụng (VNĐ)"],
  ["Validity (Days)","Thời hạn voucher (Ngày)"],
  ["Official Response & Explanation to Member","Phản hồi & Lời giải thích gửi đến hội viên"],
  ["Enter response note explaining resolution or rejection reason. This will be sent directly to the member.","Nhập nội dung phản hồi giải thích phương án xử lý hoặc lý do từ chối. Lời nhắn này sẽ được gửi vào thông báo của hội viên."],
  ["Submit Resolution & Notify Member","Hoàn Tất Xử Lý & Gửi Thông Báo"],
  ["Support Desk & Cancellations","Quầy Hỗ Trợ & Hủy Lớp"],
  ["Center Operations: Support & Escalation Reviews","Trung Tâm Điều Hành: Xét Duyệt Khiếu Nại & Hoàn Tiền"],
  ["Review escalated member appeals, authorize cash or bank refunds, and oversee facility maintenance tickets.","Xem xét các đơn khiếu nại chuyển cấp từ Lễ tân, phê duyệt hoàn tiền mặt hoặc cấp bảo lưu đặc cách."],
  ["Support & Escalations","Hỗ Trợ & Khiếu Nại"],
  ["Review escalated member cancellation appeals and facility inquiries.","Xem xét các đơn khiếu nại chuyển cấp từ Lễ tân và phản hồi CSVC."],
  ["Phê Duyệt Hoàn Tiền Mặt / Chuyển Khoản","Phê Duyệt Hoàn Tiền Mặt / Chuyển Khoản"],
  ["Approve Cash / Bank Refund","Phê Duyệt Hoàn Tiền Mặt / Chuyển Khoản"],
  ["Duyệt lệnh xuất quỹ/kế toán chuyển khoản hoàn trả học phí cho học viên.","Duyệt lệnh xuất quỹ/kế toán chuyển khoản hoàn trả học phí cho học viên."],
  ["Authorize cash disbursement or bank refund transfer to student.","Duyệt lệnh xuất quỹ/kế toán chuyển khoản hoàn trả học phí cho học viên."],
  ["Xác nhận lệnh hoàn tiền mặt / chuyển khoản (Thẩm quyền Quản lý)","Xác nhận lệnh hoàn tiền mặt / chuyển khoản (Thẩm quyền Quản lý)"],
  ["Số tiền duyệt hoàn (VNĐ)","Số tiền duyệt hoàn (VNĐ)"],
  ["Hình thức chi trả","Hình thức chi trả"],
  ["Tiền mặt tại quầy / Chuyển khoản ngân hàng","Tiền mặt tại quầy / Chuyển khoản ngân hàng"],

  // Statuses, Priorities, and Table Controls (Bidirectional)
  ["Pending","Chờ duyệt"],
  ["In Progress","Đang xử lý"],
  ["Resolved","Đã giải quyết"],
  ["Approved","Đã duyệt"],
  ["Escalated","Đã chuyển Quản lý"],
  ["Rejected","Đã từ chối"],
  ["Priority","Mức ưu tiên"],
  ["Priority:","Mức ưu tiên:"],
  ["Urgent","Khẩn cấp"],
  ["High","Cao"],
  ["Normal","Bình thường"],
  ["Low","Thấp"],
  ["Est. Credit","Ước tính bảo lưu"],
  ["taken","đã học"],
  ["tickets","phiếu"],
  ["Showing page","Đang xem trang"],
  ["of","trên"],
  ["Close","Đóng"],
  ["Cancel","Hủy"],
  ["Please provide a response note for the member.","Vui lòng cung cấp ghi chú phản hồi cho hội viên."],
  ["Failed to process response.","Không thể xử lý phản hồi."],
  ["Support ticket resolved and member notified successfully.","Đã xử lý phiếu hỗ trợ và gửi thông báo tới hội viên thành công."],
  ["Loading support tickets...","Đang tải danh sách phiếu hỗ trợ..."],
  ["No support requests match the criteria","Không có yêu cầu hỗ trợ nào phù hợp tiêu chí"],
  ["Change your filters or search query to find tickets.","Thay đổi bộ lọc hoặc từ khóa tìm kiếm để xem các phiếu khác."],
  ["View Details","Xem chi tiết"],
  ["Hide Details","Ẩn chi tiết"],
  ["Submitted on","Đã gửi vào lúc"],
  ["Loading credits...","Đang tải mã tín dụng..."],
  ["Loading tickets...","Đang tải phiếu hỗ trợ..."],
  ["Support Ticket Details","Chi Tiết Phiếu Hỗ Trợ"],
  ["Resolution Outcome","Kết quả & Biên bản xử lý"],
  ["Credit Voucher Issued","Đã cấp Voucher tín dụng"],
  ["Amount","Số tiền"],
  ["Direct Cash / Bank Refund Approved","Đã duyệt hoàn tiền mặt / chuyển khoản"],
  ["Authorized by Center Management","Được phê duyệt bởi Quản lý trung tâm"],
  ["Processed By","Người xử lý"],
  ["Official Response to Member","Lời nhắn chính thức gửi tới hội viên"],
  ["Ticket Escalated to Center Management","Phiếu đã chuyển lên Quản lý trung tâm"],
  ["This ticket involves mid-course refund or exception and has been escalated to Center Manager for review. Receptionists cannot modify escalated tickets.","Phiếu này cần hoàn học phí hoặc khiếu nại và đã được chuyển lên Quản lý trung tâm xét duyệt. Lễ tân không thể thay đổi phiếu đã chuyển cấp."],
  ["Revoke Approval","Thu Hồi Phê Duyệt"],
  ["Revoke Refund & Resolution","Thu Hồi Phê Duyệt & Hủy Quyết Định"],
  ["Revoke Reason (Required)","Lý do thu hồi (Bắt buộc)"],
  ["Enter reason for revoking approval (e.g. member policy violation, fraud, incorrect amount)...","Nhập lý do thu hồi phê duyệt (ví dụ: phát hiện vi phạm quy chế, sai sót số tiền, gian lận)..."],
  ["Confirm Revocation","Xác nhận thu hồi"],
  ["Warning: Revoking will invalidate the granted credit voucher in the member's wallet and set the ticket to Rejected. If the voucher has already been spent, revocation will be blocked.","Cảnh báo: Thao tác này sẽ vô hiệu hóa mã voucher tín dụng trong ví của hội viên và chuyển đơn sang trạng thái Đã từ chối. Nếu voucher đã được học viên sử dụng, hệ thống sẽ chặn thu hồi."],
  ["Please provide a reason for revoking the approval.","Vui lòng nhập lý do thu hồi phê duyệt."],
  ["Failed to revoke approval.","Không thể thu hồi phê duyệt."],
  ["Approval decision revoked successfully.","Đã thu hồi quyết định phê duyệt thành công."],
  ["Thiết lập Voucher Tín Dụng Hoàn Trả","Thiết lập Voucher Tín Dụng Hoàn Trả"],
  ["Set Up Credit Refund Voucher","Thiết lập Voucher Tín Dụng Hoàn Trả"],
  ["Select Desired Compensation Benefit","Chọn Quyền Lợi Bồi Thường Mong Muốn"],
  ["Choose how you would like to be compensated if this class is cancelled.","Chọn cách bạn muốn được bồi thường / hỗ trợ khi hủy lớp học này."],
  ["Compensation Benefit","Quyền Lợi Bồi Thường"],
  ["Preferred Compensation","Quyền Lợi Đề Xuất"],
  ["Course Credit Voucher (Recommended)","Voucher Tín Dụng Khóa Học (Khuyên dùng)"],
  ["Course Credit Voucher","Voucher Tín Dụng Khóa Học"],
  ["100% or prorated value credited for 60 days to book any other class or gym package.","Bảo lưu 100% hoặc giá trị số buổi chưa học vào voucher 60 ngày để đổi môn tập khác."],
  ["Fastest processing & retention","Xử lý nhanh nhất & bảo lưu học phí"],
  ["Free 1-Month Gym Pass","Đổi Sang Thẻ Tập Gym 1 Tháng"],
  ["Exchange remaining sessions for 1 full month of unlimited gym & fitness access.","Quy đổi các buổi chưa học thành thẻ tập gym toàn thời gian 1 tháng miễn phí."],
  ["Instant activation upon review","Kích hoạt ngay khi được duyệt"],
  ["Cash / Bank Refund Request","Yêu Cầu Hoàn Tiền Mặt / Chuyển Khoản"],
  ["Cash / Bank Refund","Hoàn Tiền Mặt / Chuyển Khoản"],
  ["Request remaining class tuition refunded via bank transfer or cash at counter.","Yêu cầu hoàn trả học phí các buổi chưa học bằng tiền mặt hoặc chuyển khoản."],
  ["Requires Center Manager approval","Cần Quản lý trung tâm phê duyệt"],
  ["Member's Requested Benefit:","Nguyện vọng bồi thường của học viên:"],
  ["Member's Requested Compensation:","Nguyện vọng bồi thường của học viên:"],
  ["Member's Choice","Học viên lựa chọn"],
  ["Credit Voucher","Voucher tín dụng"],
  ["1-Month Gym Pass","Thẻ tập Gym 1 tháng"],
  ["Requested Benefit","Quyền lợi mong muốn"],
  ["Member requested compensation: Credit Voucher.","Học viên mong muốn nhận Voucher tín dụng bảo lưu học phí."],
  ["Member requested compensation: 1-Month Gym Pass.","Học viên mong muốn đổi sang Thẻ tập Gym 1 tháng miễn phí."],
  ["Member requested compensation: Cash / Bank Refund.","Học viên đề xuất Hoàn lại tiền mặt / chuyển khoản học phí."],
  ["Học viên mong muốn nhận Voucher tín dụng để tiếp tục học môn khác.","Học viên mong muốn nhận Voucher tín dụng để tiếp tục học môn khác."],
  ["Học viên mong muốn đổi sang Thẻ tập Gym 1 tháng thay vì học lớp.","Học viên mong muốn đổi sang Thẻ tập Gym 1 tháng thay vì học lớp."],
  ["Học viên yêu cầu hoàn lại tiền học phí bằng tiền mặt hoặc chuyển khoản ngân hàng.","Học viên yêu cầu hoàn lại tiền học phí bằng tiền mặt hoặc chuyển khoản ngân hàng."],
  ["Confirm Cancel & Receive Credit Now","Xác nhận hủy & Nhận Voucher ngay"],
  ["Send Special Request to Reception","Gửi yêu cầu đặc biệt đến Lễ tân"],
  ["Auto-issued instantly (1-click)","Cấp ngay lập tức (1 chạm)"],
  ["Quick reception review","Ưu tiên lễ tân duyệt nhanh"],
  ["Requires Manager review","Cần Quản lý trung tâm duyệt"],
  ["System Automated","Hệ thống tự động"],
  ["Approved & Resolved","Đã duyệt tự động"],
  ["Cancellation & Retention Request for","Yêu cầu hủy & bảo lưu lớp"],
  ["Warning:","Cảnh báo:"],
  ["Teaching Method & Delivery","Phương pháp giảng dạy & Truyền đạt"],
  ["Attitude & Member Care","Thái độ & Tác phong hỗ trợ học viên"],
  ["Punctuality & Professionalism","Đúng giờ & Tác phong đứng lớp"],
  ["Technical Expertise & Form Correction","Kỹ năng chuyên môn & Sửa lỗi động tác"],
  ["Other Feedback","Góp ý khác"],
  ["Feedback Aspect","Nội dung góp ý HLV"],
  ["Gym & Free Weights Area","Khu tập Gym & Tạ tự do"],
  ["Cardio Zone","Khu máy chạy & Cardio"],
  ["Studio / Yoga / Aerobics Room","Phòng Studio / Yoga / Aerobics"],
  ["Swimming Pool & Jacuzzi","Khu Bể bơi / Jacuzzi"],
  ["Locker Room & Sauna","Phòng thay đồ / Tắm / Sauna"],
  ["Lobby & Reception Area","Khu Lễ tân & Sảnh chờ"],
  ["Other Area","Khu vực khác"],
  ["Facility Area","Khu vực cơ sở vật chất"],
  ["Device / Location Detail","Tên máy / Vị trí cụ thể"],
  ["Urgency Level","Mức độ khẩn cấp"],
  ["Urgent (Safety Risk / Major Breakdown)","Khẩn cấp (Nguy cơ mất an toàn / Hỏng nặng)"],
  ["Normal (Affects Workout Experience)","Bình thường (Ảnh hưởng trải nghiệm tập)"],
  ["Low (Routine Maintenance / Cleaning)","Thấp (Bảo trì định kỳ / Vệ sinh)"],
  ["Request Single Session Absence","Báo xin nghỉ có phép một buổi"],
  ["Register Makeup Session","Đăng ký học bù sang ca/lớp khác"],
  ["Request Class Time Transfer","Xin chuyển sang khung giờ / ngày khác cố định"],
  ["Schedule & Holiday Inquiry","Hỏi lịch học / Lịch nghỉ lễ / Lịch bù"],
  ["Schedule Support Type","Hình thức hỗ trợ lịch tập"],
  ["Session / Date Detail","Thông tin buổi học / Ngày giờ"],
  ["Staff / Receptionist Service","Thái độ phục vụ của nhân viên / lễ tân"],
  ["Cleanliness & Environment","Vệ sinh & Môi trường phòng tập"],
  ["Pricing, Membership & Billing Policy","Chính sách giá, gói tập & thanh toán"],
  ["Other Issue","Vấn đề khác"],
  ["Complaint Area","Lĩnh vực khiếu nại"],
  ["Incident Date & Time","Thời gian xảy ra sự việc (Nếu có)"],
  ["Select Enrolled Class","Chọn lớp học đang tham gia"],
  ["You are not enrolled in any active classes to request cancellation or retention.","Bạn hiện chưa tham gia lớp học nào để yêu cầu hủy hoặc bảo lưu."],
  ["Submit Feedback to Reception","Gửi góp ý tới Lễ tân"],
  ["Submit Incident Report","Gửi báo cáo sự cố"],
  ["Submit Schedule Request","Gửi yêu cầu lịch học"],
  ["Submit Complaint to Reception","Gửi khiếu nại tới Lễ tân"],
  ["Submit Question to Reception","Gửi câu hỏi tới Lễ tân"],
  ["View My Support Tickets","Xem Phiếu Hỗ Trợ Của Tôi"],
  ["Please select an enrolled class to cancel or retain.","Vui lòng chọn lớp học bạn muốn hủy hoặc bảo lưu."],
  ["Please describe your schedule support request.","Vui lòng mô tả yêu cầu hỗ trợ lịch học của bạn."],
  ["Select Request Category","Chọn loại yêu cầu hỗ trợ"],
  ["Title / Subject","Tiêu đề yêu cầu"],
  ["Brief summary of your feedback","Tóm tắt ngắn gọn ý kiến góp ý của bạn"],
  ["Brief summary of facility issue","Tóm tắt ngắn gọn sự cố hoặc hư hỏng thiết bị"],
  ["Brief summary of schedule request","Tóm tắt ngắn gọn yêu cầu lịch học"],
  ["Brief summary of your complaint","Tóm tắt ngắn gọn nội dung khiếu nại của bạn"],
  ["Brief summary of your issue or request","Tóm tắt ngắn gọn vấn đề hoặc thắc mắc của bạn"],
  ["Service Complaint & Appeals","Khiếu nại dịch vụ & Phản ánh"],
  ["General Inquiry & Assistance","Hỏi đáp chung & Thắc mắc khác"],
  ["Request class cancellation, credit voucher or refund","Yêu cầu bảo lưu, hoàn voucher hoặc bồi hoàn học phí"],
  ["Feedback on coaching attitude, method or technique","Phản hồi về phương pháp, thái độ hoặc chuyên môn HLV"],
  ["Report broken equipment, gym rooms or hygiene","Báo hỏng máy móc, phòng tập hoặc vệ sinh cơ sở"],
  ["Request session makeup, single absence or time swap","Báo nghỉ có phép, đăng ký học bù hoặc chuyển ca"],
  ["Report service issues, staff conduct or disputes","Phản ánh thái độ nhân viên, chính sách hoặc sự cố"],
  ["Ask general questions about packages or services","Giải đáp thắc mắc thông tin gói tập hoặc dịch vụ"],
  ["Schedule Support & Absence/Makeup","Hỗ trợ lịch tập & Xin nghỉ/Học bù"],
  ["Complaint / Feedback","Khiếu nại / Phản ánh"],
  ["Facility & Equipment Broken Report","Báo sự cố thiết bị & CSVC"],
  ["General Inquiry / Assistance","Hỏi đáp chung & Thắc mắc khác"],
  ["Withdraw Support Request?","Rút yêu cầu hỗ trợ?"],
  ["Are you sure you want to withdraw this request? Once withdrawn, the ticket will be closed and you can submit a new request if needed.","Bạn có chắc chắn muốn rút yêu cầu hỗ trợ này? Sau khi rút, đơn sẽ được đóng lại và bạn có thể gửi lại yêu cầu mới nếu cần."],
  ["Withdraw Request","Rút yêu cầu"],
  ["Keep Request","Giữ lại đơn"],
  ["Support request withdrawn successfully.","Đã rút yêu cầu thành công."],
  ["Failed to withdraw support request.","Rút yêu cầu thất bại."],
  ["Withdraw / Cancel this request","Rút / Hủy yêu cầu này"],
  ["Withdrawing...","Đang rút đơn..."],
  ["Withdraw this ticket to re-select","Rút đơn này để chọn lại"],
  ["(The old ticket will be closed to unlock new submission)","(Đơn cũ sẽ đóng lại để mở khóa tạo đơn mới)"],
  ["This class has a pending request","Lớp học này đang có yêu cầu chờ xử lý"],
  ["You already submitted ticket","Bạn đã gửi đơn"],
  ["If you want to choose a different compensation option, you can withdraw this ticket to submit a new one.","Nếu bạn đổi ý muốn thay đổi phương án bồi hoàn, bạn có thể rút đơn này để gửi lại đơn mới."],
  ["Template: Close as Duplicate","Mẫu: Đóng do trùng lặp"],
  ["Transfer Class","Chuyển lớp"],
  ["Chuyển lớp học","Class Transfer"],
  ["Đổi sang lớp học tương đương đồng giá và chưa khai giảng","Switch to an equivalent class of the same price before course start"],
  ["Đang kiểm tra lớp học & lịch đối chiếu...","Checking classes and schedules..."],
  ["Chuyển lớp học thành công!","Class Transferred Successfully!"],
  ["Xem lịch tập mới","View New Schedule"],
  ["Lớp học hiện tại của bạn","Your Current Class"],
  ["Chưa bắt đầu · Đủ điều kiện chuyển","Not Started · Eligible for Transfer"],
  ["Chọn lớp học tương đương để chuyển sang","Select an Equivalent Class to Transfer To"],
  ["Danh sách các lớp đồng giá","List of equivalent-priced classes"],
  ["chưa khai giảng và không trùng lịch học","not yet started and without schedule conflicts"],
  ["lớp khả dụng","classes available"],
  ["Không trùng lịch · Còn","No conflict · Remaining"],
  ["Đã hết chỗ trống","Fully Booked"],
  ["Trùng lịch với lớp khác","Conflict with another class"],
  ["Sẽ chuyển sang:","Will transfer to:"],
  ["Vui lòng chọn 1 lớp học tương đương để tiếp tục","Please select an equivalent class to continue"],
  ["Xác nhận chuyển lớp","Confirm Class Transfer"],
  ["Classes & Schedule","Lịch & Lớp học"],
  ["Coach & Workouts","Huấn luyện viên"],
  ["Packages & Billing","Gói & Thanh toán"],
  ["Support Desk","Hỗ trợ học viên"],
  ["System Alerts","Hệ thống & Cảnh báo"],
  ["Unread only","Chỉ chưa đọc"],
  ["Search notifications...","Tìm kiếm thông báo..."],
  ["No notifications found in this category","Không có thông báo nào trong mục này"],
  ["Try adjusting your keyword filter or show read notifications.","Hãy thử thay đổi từ khóa tìm kiếm hoặc bỏ chọn lọc chỉ chưa đọc."],
  ["You don't have any notifications under this tab.","Bạn chưa có thông báo nào thuộc phân mục này."],
  ["Clear filters","Xóa bộ lọc"],
  ["Workout Plan","Giáo án rèn luyện"],
  ["Membership Package","Gói hội viên"],
  ["Member Support","Hỗ trợ học viên"],
  ["Support Revoked","Thu hồi hỗ trợ"],
  ["Urgent","Khẩn cấp"],
  ["Announcement","Thông báo chung"],
  ["System","Hệ thống"],
  ["View Schedule","Xem lịch tập"],
  ["View Dashboard","Xem tổng quan"],
  ["View Workout Plan","Xem giáo án"],
  ["View Invoices","Xem hóa đơn"],
  ["View Packages","Xem gói tập"],
  ["View Ticket","Xem yêu cầu"]
];
for (const [en, vi] of supportTranslations) {
  translations[en] = [en, vi];
  translations[vi] = [en, vi];
}
