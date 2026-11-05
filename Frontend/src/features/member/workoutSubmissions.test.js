import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

test('SubmitWorkoutModal and CoachReviewSubmissionModal render safely without crashing across languages', async () => {
  const server = await createServer({
    server: { middlewareMode: true, ws: false },
    appType: 'custom',
    logLevel: 'error'
  });

  try {
    const { default: SubmitWorkoutModal } = await server.ssrLoadModule(
      '/src/features/member/components/SubmitWorkoutModal.jsx'
    );
    const { default: CoachReviewSubmissionModal } = await server.ssrLoadModule(
      '/src/features/coach/components/CoachReviewSubmissionModal.jsx'
    );
    const { default: MemberWorkoutsModal } = await server.ssrLoadModule(
      '/src/features/member/components/MemberWorkoutsModal.jsx'
    );
    const { setLanguage } = await server.ssrLoadModule('/src/i18n/languageStore.js');

    // ==================== VIETNAMESE ('vi') ====================
    setLanguage('vi');

    // 1. SubmitWorkoutModal for a new submission (VI)
    assert.doesNotThrow(() => {
      const html = renderToStaticMarkup(
        React.createElement(SubmitWorkoutModal, {
          isOpen: true,
          onClose: () => {},
          workoutPlan: { planId: 10, title: 'Kế hoạch Bơi lội & Yoga' },
          exercise: { detailId: 101, exerciseName: 'Bơi sải 100m' },
          existingSubmission: null
        })
      );
      assert.ok(html.includes('Nộp Bài Tập / Video'));
      assert.ok(html.includes('Bơi sải 100m'));
      assert.ok(html.includes('Gửi bài tập cho HLV'));
    });

    // 2. SubmitWorkoutModal with existing reviewed submission (VI)
    assert.doesNotThrow(() => {
      const html = renderToStaticMarkup(
        React.createElement(SubmitWorkoutModal, {
          isOpen: true,
          onClose: () => {},
          workoutPlan: { planId: 10, title: 'Kế hoạch Boxing' },
          exercise: { detailId: 102, exerciseName: 'Kỹ thuật Jab' },
          existingSubmission: {
            submissionId: 55,
            videoUrl: 'https://youtube.com/watch?v=sample123',
            studentNote: 'Em hoàn thành 3 hiệp',
            status: 'APPROVED',
            rating: 5,
            coachFeedback: 'Đòn đánh thẳng và thu tay về phòng thủ rất tốt!'
          }
        })
      );
      assert.ok(html.includes('Trạng thái đánh giá từ HLV'));
      assert.ok(html.includes('Đạt chuẩn'));
      assert.ok(html.includes('Đòn đánh thẳng'));
      assert.ok(html.includes('Mở xem lại video đã nộp'));
      assert.ok(html.includes('Nộp lại bài tập mới'));
    });

    // 3. CoachReviewSubmissionModal for reviewing a submission (VI)
    assert.doesNotThrow(() => {
      const html = renderToStaticMarkup(
        React.createElement(CoachReviewSubmissionModal, {
          isOpen: true,
          onClose: () => {},
          submission: {
            submissionId: 55,
            studentName: 'Nguyễn Văn A',
            studentEmail: 'nguyenvana@gmail.com',
            exerciseName: 'Tư thế Yoga Chiến Binh',
            planTitle: 'Khoá Yoga Linh Hoạt',
            videoUrl: 'https://drive.google.com/file/d/sample/view',
            studentNote: 'Nhờ thầy xem giúp độ mở hông',
            status: 'SUBMITTED',
            submittedAt: '2026-11-04T10:00:00'
          },
          onReviewSuccess: () => {}
        })
      );
      assert.ok(html.includes('Đánh Giá Bài Nộp Học Viên'));
      assert.ok(html.includes('Nguyễn Văn A'));
      assert.ok(html.includes('Mở xem video bài nộp'));
      assert.ok(html.includes('Đạt chuẩn'));
      assert.ok(html.includes('Tập lại'));
      assert.ok(html.includes('Gửi nhận xét cho học viên'));
    });

    // ==================== ENGLISH ('en') ====================
    setLanguage('en');

    // 4. SubmitWorkoutModal for a new submission (EN)
    assert.doesNotThrow(() => {
      const html = renderToStaticMarkup(
        React.createElement(SubmitWorkoutModal, {
          isOpen: true,
          onClose: () => {},
          workoutPlan: { planId: 10, title: 'Swimming & Yoga Plan' },
          exercise: { detailId: 101, exerciseName: 'Freestyle 100m' },
          existingSubmission: null
        })
      );
      assert.ok(html.includes('Submit Workout / Video'));
      assert.ok(html.includes('Freestyle 100m'));
      assert.ok(html.includes('Submit workout to coach') || html.includes('Submit Workout to Coach'));
    });

    // 5. SubmitWorkoutModal with existing reviewed submission (EN)
    assert.doesNotThrow(() => {
      const html = renderToStaticMarkup(
        React.createElement(SubmitWorkoutModal, {
          isOpen: true,
          onClose: () => {},
          workoutPlan: { planId: 10, title: 'Boxing Plan' },
          exercise: { detailId: 102, exerciseName: 'Jab Technique' },
          existingSubmission: {
            submissionId: 55,
            videoUrl: 'https://youtube.com/watch?v=sample123',
            studentNote: 'Completed 3 sets',
            status: 'APPROVED',
            rating: 5,
            coachFeedback: 'Straight punch and great guard recovery!'
          }
        })
      );
      assert.ok(html.includes('Coach Review Status') || html.includes('Coach Evaluation Status'));
      assert.ok(html.includes('Approved'));
      assert.ok(html.includes('Open submitted video'));
      assert.ok(html.includes('Submit New Workout'));
    });

    // 6. CoachReviewSubmissionModal for reviewing a submission (EN)
    assert.doesNotThrow(() => {
      const html = renderToStaticMarkup(
        React.createElement(CoachReviewSubmissionModal, {
          isOpen: true,
          onClose: () => {},
          submission: {
            submissionId: 55,
            studentName: 'John Doe',
            studentEmail: 'johndoe@gmail.com',
            exerciseName: 'Warrior Pose',
            planTitle: 'Flexible Yoga Course',
            videoUrl: 'https://drive.google.com/file/d/sample/view',
            studentNote: 'Please check hip opening',
            status: 'SUBMITTED',
            submittedAt: '2026-11-04T10:00:00'
          },
          onReviewSuccess: () => {}
        })
      );
      assert.ok(html.includes('Review Student Submission'));
      assert.ok(html.includes('John Doe'));
      assert.ok(html.includes('Open submission video') || html.includes('Open Submission Video'));
      assert.ok(html.includes('Approved'));
      assert.ok(html.includes('Retrain'));
      assert.ok(html.includes('Send feedback to student') || html.includes('Send Feedback to Student'));
    });

    // 7. Closed modals should return null / empty string
    const emptyHtml = renderToStaticMarkup(
      React.createElement(SubmitWorkoutModal, { isOpen: false })
    );
    assert.equal(emptyHtml, '');

    // 8. MemberWorkoutsModal renders safely when open or closed across languages
    const memberModalClosed = renderToStaticMarkup(
      React.createElement(MemberWorkoutsModal, { isOpen: false, onClose: () => {} })
    );
    assert.equal(memberModalClosed, '');

    assert.doesNotThrow(() => {
      const memberModalOpen = renderToStaticMarkup(
        React.createElement(MemberWorkoutsModal, { isOpen: true, onClose: () => {} })
      );
      assert.ok(memberModalOpen.length > 0);
    });
  } finally {
    await server.close();
  }
});
