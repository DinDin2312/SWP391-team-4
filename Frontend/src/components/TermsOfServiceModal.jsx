import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, FileText, CheckCircle2, HeartPulse, Clock, CreditCard, Lock, Sparkles } from 'lucide-react';
import { t, useLanguage } from '../i18n/useLanguage';

const TermsOfServiceModal = ({ isOpen, onClose, onAccept }) => {
  useLanguage();

  const sections = [
    {
      id: 'membership',
      icon: ShieldCheck,
      title: t("1. Quy chế Thẻ Hội viên & Định danh mã QR (Membership & QR Pass)"),
      points: [
        t("Tài khoản hội viên và mã QR Pass Check-in là định danh cá nhân độc quyền, nghiêm cấm chia sẻ, cho mượn hoặc chuyển nhượng trái phép cho bên thứ ba."),
        t("Hội viên cần thực hiện quét mã QR tại cổng kiểm soát Turnstile trước mỗi buổi tập ít nhất 05–10 phút để hệ thống ghi nhận điểm danh tự động."),
        t("Trường hợp phát hiện hành vi gian lận mượn thẻ, Trung tâm có quyền đình chỉ quyền ra vào của tài khoản mà không hoàn lại học phí.")
      ]
    },
    {
      id: 'safety',
      icon: HeartPulse,
      title: t("2. Cam kết Thể chất & Miễn trừ Trách nhiệm Y tế (Health & Liability Waiver)"),
      points: [
        t("Hội viên cam kết chủ động đánh giá thể trạng và thông báo trung thực với Huấn luyện viên (PT) về tiền sử chấn thương, tim mạch, huyết áp hoặc hạn chế vận động trước khi tham gia lớp."),
        t("Hội viên tự nguyện tham gia các chương trình tập luyện và chịu trách nhiệm lắng nghe giới hạn thể lực của bản thân. Trung tâm không chịu trách nhiệm đối với các chấn thương phát sinh do tự ý nâng tạ sai kỹ thuật ngoài hướng dẫn của HLV."),
        t("Trung tâm trang bị đầy đủ dụng cụ sơ cứu y tế khẩn cấp và thiết bị theo dõi nhịp tim sinh trắc học tiêu chuẩn tại quầy Lễ tân.")
      ]
    },
    {
      id: 'conduct',
      icon: FileText,
      title: t("3. Nội quy Phòng tập & Khu Bể bơi Bốn Mùa (Facility & Pool Conduct)"),
      points: [
        t("Trang phục tập luyện: Bắt buộc đi giày thể thao đế cao su sạch và mặc quần áo thể thao co giãn chuyên dụng. Không đi chân đất hoặc dép lê vào sàn tạ."),
        t("Khu Bể bơi: Bắt buộc tắm tráng bằng nước sạch trước khi xuống hồ; đội mũ bơi và tuân thủ tuyệt đối sự hướng dẫn của Cứu hộ viên trực sàn."),
        t("Ý thức chung: Lau sạch mồ hôi trên máy tập sau khi sử dụng; cất trả tạ đơn, đĩa tạ và phụ kiện về đúng giá đỡ quy định.")
      ]
    },
    {
      id: 'booking',
      icon: Clock,
      title: t("4. Quy chế Đặt lịch, Hủy ca & Bảo lưu Khóa học (Class Booking & Cancellation)"),
      points: [
        t("Hội viên được đặt trước chỗ lớp học tối đa 07 ngày qua Cổng trực tuyến. Chỗ học chỉ được đảm bảo sau khi hoàn tất xác nhận thanh toán/giữ chỗ."),
        t("Chính sách hủy ca: Mọi yêu cầu hủy lớp phải được gửi trước giờ học tối thiểu 02 (hai) giờ. Hệ thống sẽ tự động hoàn trả hạn mức buổi tập hoặc cấp Tín dụng hoàn tiền (Voucher Credit) tương ứng."),
        t("Vắng mặt không báo trước (No-show): Buổi học sẽ bị tính là đã tham gia và không được bồi hoàn.")
      ]
    },
    {
      id: 'payment',
      icon: CreditCard,
      title: t("5. Phí dịch vụ, Tín dụng & Chính sách Hoàn tiền (Fees & Refund Policy)"),
      points: [
        t("Tất cả mức giá niêm yết trên hệ thống đã bao gồm thuế và phí dịch vụ thể thao. Giao dịch được xử lý an toàn qua cổng thanh toán bảo mật mã hóa SSL 256-bit (VNPay, MoMo, PayOS)."),
        t("Các gói tập đã thanh toán và kích hoạt sử dụng sẽ không được hoàn trả tiền mặt. Trong trường hợp bất khả kháng về sức khỏe (có chỉ định y khoa), hội viên được hỗ trợ bảo lưu thời hạn tối đa 30 ngày."),
        t("Hóa đơn điện tử VAT được xuất tự động và lưu trữ vĩnh viễn trong mục Lịch sử Giao dịch của Hội viên.")
      ]
    },
    {
      id: 'privacy',
      icon: Lock,
      title: t("6. Bảo vệ Dữ liệu Cá nhân & An ninh Giám sát (Privacy & Security)"),
      points: [
        t("NEXUS cam kết bảo mật tuyệt đối thông tin danh tính, số điện thoại, lịch sử tập luyện và chỉ số thể chất của Hội viên, không cung cấp cho bất kỳ đơn vị quảng cáo nào."),
        t("Hệ thống Camera an ninh độ phân giải cao được vận hành 24/7 tại các khu vực tập luyện công cộng nhằm đảm bảo an toàn tính mạng và tài sản (nghiêm cấm lắp đặt camera tại khu Locker và phòng thay đồ).")
      ]
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
          >
          {/* Header */}
          <div className="relative px-6 py-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold uppercase tracking-wider text-blue-100">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>{t("Văn bản pháp lý chính thức · NEXUS 2026")}</span>
                  </div>
                  <h2 className="text-lg font-bold tracking-tight text-white mt-0.5">
                    {t("Điều khoản Dịch vụ & Quy chế Hoạt động")}
                  </h2>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/90 hover:text-white transition-colors cursor-pointer"
                aria-label={t("Đóng")}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-800 dark:text-slate-200 custom-scrollbar text-sm leading-relaxed">
            <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-blue-900 dark:text-blue-200 text-xs">
              <p className="font-semibold mb-1">
                {t("Chào mừng bạn gia nhập Hệ sinh thái Thể thao Công nghệ cao NEXUS Sports Center!")}
              </p>
              <p className="opacity-90 leading-normal">
                {t("Bằng việc đăng ký tài khoản hoặc sử dụng dịch vụ/thẻ hội viên của chúng tôi, bạn đồng ý tuân thủ toàn bộ các quy định pháp lý, an toàn vận động và chính sách bảo mật dưới đây.")}
              </p>
            </div>

            {sections.map((sec) => {
              const Icon = sec.icon;
              return (
                <div key={sec.id} className="space-y-2.5">
                  <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400 font-bold text-sm">
                    <div className="w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center shrink-0">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <h4>{sec.title}</h4>
                  </div>
                  <ul className="space-y-2 pl-9 text-xs sm:text-[13px] text-slate-600 dark:text-slate-400 list-disc">
                    {sec.points.map((pt, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-4 px-6 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
              {t("Áp dụng trên toàn bộ hệ thống cơ sở NEXUS Sports Center")}
            </span>
            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {t("Đóng")}
              </button>
              {onAccept && (
                <button
                  type="button"
                  onClick={() => {
                    onAccept();
                    onClose();
                  }}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{t("Tôi đã hiểu và Đồng ý")}</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
  );
};

export default TermsOfServiceModal;
