import { useLanguage } from '../../../i18n/useLanguage';
import React, { useState, useEffect, useCallback } from 'react';
import ReceptionistLayout from '../../../layouts/ReceptionistLayout';
import MemberManagementView from '../components/MemberManagementView';
import RegisterMemberView from '../components/RegisterMemberView';
import ManageMembershipsView from '../components/ManageMembershipsView';
import MemberCheckInView from '../components/MemberCheckInView';
import InvoiceManagementView from '../components/InvoiceManagementView';

const ReceptionistDashboard = () => {
  useLanguage();
  const [activeFeature, setActiveFeature] = useState('search-members');
  const [checkinMemberId, setCheckinMemberId] = useState(null);

  const handleSelectFeature = useCallback((featureId) => {
    setActiveFeature((prev) => {
      if (prev !== featureId) {
        window.history.pushState({ receptionistTab: featureId }, '');
      }
      return featureId;
    });
  }, []);

  const handleQuickCheckIn = useCallback((userId) => {
    setCheckinMemberId(userId);
    handleSelectFeature('member-checkin');
  }, [handleSelectFeature]);

  useEffect(() => {
    if (!window.history.state?.receptionistTab && !window.history.state?.nexusModal) {
      window.history.replaceState({ receptionistTab: 'search-members' }, '');
    }
    const handlePopState = (event) => {
      if (event.state?.receptionistTab) {
        setActiveFeature(event.state.receptionistTab);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <ReceptionistLayout activeFeature={activeFeature} onSelectFeature={handleSelectFeature}>
      {activeFeature === 'search-members' && (
        <MemberManagementView onQuickCheckIn={handleQuickCheckIn} />
      )}

      {activeFeature === 'member-checkin' && (
        <MemberCheckInView
          initialMemberId={checkinMemberId}
          onSwitchToRenew={() => handleSelectFeature('manage-memberships')}
        />
      )}

      {activeFeature === 'register-member' && (
        <RegisterMemberView onSuccess={() => handleSelectFeature('search-members')} />
      )}

      {activeFeature === 'manage-memberships' && <ManageMembershipsView />}

      {activeFeature === 'manage-invoices' && <InvoiceManagementView />}
    </ReceptionistLayout>
  );
};

export default ReceptionistDashboard;