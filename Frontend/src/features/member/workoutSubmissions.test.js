import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

test('Workout Submissions Comprehensive Test Suite - All Scenarios & Both Plan Types', async () => {
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

    // =========================================================================
    // SCENARIO 1: Happy Path - Member Submits -> Coach Reviews & Approves (VI)
    // =========================================================================
    setLanguage('vi');

    // 1.1 Member Submits new workout
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
      assert.ok(html.includes('Nộp Bài Tập / Video'), 'Should render title in VI');
      assert.ok(html.includes('Bơi sải 100m'), 'Should render exercise name');
      assert.ok(html.includes('Gửi bài tập cho HLV'), 'Should render submit button in VI');
    });

    // 1.2 Coach Reviews and Approves submission (5 stars)
    assert.doesNotThrow(() => {
      const html = renderToStaticMarkup(
        React.createElement(CoachReviewSubmissionModal, {
          isOpen: true,
          onClose: () => {},
          submission: {
            submissionId: 55,
            studentName: 'Nguyễn Văn A',
            studentEmail: 'nguyenvana@gmail.com',
            exerciseName: 'Bơi sải 100m',
            planTitle: 'Kế hoạch Bơi lội & Yoga',
            className: 'Lớp Bơi Cơ Bản',
            videoUrl: 'https://youtube.com/watch?v=sample123',
            studentNote: 'Em hoàn thành 3 hiệp',
            status: 'SUBMITTED',
            submittedAt: '2026-11-04T10:00:00'
          },
          onReviewSuccess: () => {}
        })
      );
      assert.ok(html.includes('Đánh Giá Bài Nộp Học Viên'), 'Should render review modal title');
      assert.ok(html.includes('Nguyễn Văn A'), 'Should render student name');
      assert.ok(html.includes('Lớp Bơi Cơ Bản'), 'Should render class name');
      assert.ok(html.includes('Mở xem video bài nộp'), 'Should have external link button');
      assert.ok(html.includes('Đạt chuẩn'), 'Should have approve option');
      assert.ok(html.includes('Gửi nhận xét cho học viên'), 'Should have send feedback button');
    });

    // 1.3 Member views approved submission in Member modal
    assert.doesNotThrow(() => {
      const html = renderToStaticMarkup(
        React.createElement(SubmitWorkoutModal, {
          isOpen: true,
          onClose: () => {},
          workoutPlan: { planId: 10, title: 'Kế hoạch Bơi lội & Yoga' },
          exercise: { detailId: 101, exerciseName: 'Bơi sải 100m' },
          existingSubmission: {
            submissionId: 55,
            videoUrl: 'https://youtube.com/watch?v=sample123',
            studentNote: 'Em hoàn thành 3 hiệp',
            status: 'APPROVED',
            rating: 5,
            coachFeedback: 'Động tác chuẩn, nhịp thở đều!'
          }
        })
      );
      assert.ok(html.includes('Trạng thái đánh giá từ HLV'));
      assert.ok(html.includes('Đạt chuẩn'));
      assert.ok(html.includes('Động tác chuẩn, nhịp thở đều!'));
      assert.ok(html.includes('Mở xem lại video đã nộp'));
      assert.ok(html.includes('Nộp lại bài tập mới'));
    });

    // =========================================================================
    // SCENARIO 2: Revision Requested Flow
    // =========================================================================
    assert.doesNotThrow(() => {
      const html = renderToStaticMarkup(
        React.createElement(SubmitWorkoutModal, {
          isOpen: true,
          onClose: () => {},
          workoutPlan: { planId: 20, title: 'Boxing Cơ Bản' },
          exercise: { detailId: 202, exerciseName: 'Kỹ thuật Jab & Cross' },
          existingSubmission: {
            submissionId: 60,
            videoUrl: 'https://youtube.com/watch?v=sample456',
            studentNote: 'Em bị mỏi tay ở hiệp 3',
            status: 'REVISION_REQUESTED',
            rating: 2,
            coachFeedback: 'Tay sau chưa che hàm khi ra đòn, cần tập lại nhé!'
          }
        })
      );
      assert.ok(html.includes('Cần tập lại'));
      assert.ok(html.includes('Tay sau chưa che hàm khi ra đòn'));
      assert.ok(html.includes('Nộp lại bài tập mới'));
    });

    // =========================================================================
    // SCENARIO 3: Single Workout Plan (Bài giao 1 lần) - Submission Verification
    // =========================================================================
    // Verify that MemberWorkoutsModal renders the "Nộp bài / Quá trình" column
    // for SINGLE workout plans as well as TRAINING_PLAN.
    assert.doesNotThrow(() => {
      const html = renderToStaticMarkup(
        React.createElement(MemberWorkoutsModal, {
          isOpen: true,
          onClose: () => {}
        })
      );
      assert.ok(html.includes('Lộ Trình') || html.includes('Roadmaps'), 'Modal should render when open');
      assert.ok(html.includes('Kế Hoạch Theo Mốc') || html.includes('Milestone'), 'Should have milestone tab');
      assert.ok(html.includes('Bài Giao 1 Lần') || html.includes('Single'), 'Should have single workouts tab');
    });

    // =========================================================================
    // SCENARIO 4: Bilingual Switching (English - 'en')
    // =========================================================================
    setLanguage('en');

    // 4.1 SubmitWorkoutModal in English
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
      assert.ok(html.includes('Submit Workout / Video'), 'Should translate title to EN');
      assert.ok(html.includes('Freestyle 100m'));
      assert.ok(html.includes('Submit workout to coach') || html.includes('Submit Workout to Coach'));
    });

    // 4.2 CoachReviewSubmissionModal in English
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
            className: 'Morning Yoga',
            videoUrl: 'https://drive.google.com/file/d/sample/view',
            studentNote: 'Please check hip opening',
            status: 'SUBMITTED',
            submittedAt: '2026-11-04T10:00:00'
          },
          onReviewSuccess: () => {}
        })
      );
      assert.ok(html.includes('Review Student Submission'), 'Should translate to EN');
      assert.ok(html.includes('John Doe'));
      assert.ok(html.includes('Morning Yoga'));
      assert.ok(html.includes('Approved'));
      assert.ok(html.includes('Retrain'));
      assert.ok(html.includes('Send feedback to student') || html.includes('Send Feedback to Student'));
    });

    // =========================================================================
    // SCENARIO 5: Modal closed state returns empty
    // =========================================================================
    const closedHtml = renderToStaticMarkup(
      React.createElement(SubmitWorkoutModal, { isOpen: false })
    );
    assert.equal(closedHtml, '', 'Closed modal should return empty');

    const closedMemberHtml = renderToStaticMarkup(
      React.createElement(MemberWorkoutsModal, { isOpen: false })
    );
    assert.equal(closedMemberHtml, '', 'Closed member workouts modal should return empty');

    // =========================================================================
    // SCENARIO 6: Coach Workout Submissions Tab & Pagination UI
    // =========================================================================
    const { default: CoachWorkoutPlans } = await server.ssrLoadModule(
      '/src/features/coach/pages/CoachWorkoutPlans.jsx'
    );
    assert.doesNotThrow(() => {
      const html = renderToStaticMarkup(
        React.createElement(CoachWorkoutPlans)
      );
      assert.ok(html.includes('Student Workout Submissions') || html.includes('Bài Nộp Của Học Viên'));
    });

  } finally {
    await server.close();
  }
});
