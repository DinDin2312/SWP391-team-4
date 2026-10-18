import { useLanguage } from '../../../i18n/useLanguage';
import React, { useState, useEffect, useCallback } from 'react';
import ReceptionistLayout from '../../../layouts/ReceptionistLayout';
import MemberManagementView from '../components/MemberManagementView';
import RegisterMemberView from '../components/RegisterMemberView';
import ManageMembershipsView from '../components/ManageMembershipsView';

const ReceptionistDashboard = () => {
  useLanguage();
  const [activeFeature, setActiveFeature] = useState('search-members');

  const handleSelectFeature = useCallback((featureId) => {
    setActiveFeature((prev) => {
      if (prev !== featureId) {
        window.history.pushState({ receptionistTab: featureId }, '');
      }
      return featureId;
    });
  }, []);

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
      {activeFeature === 'search-members' && <MemberManagementView />}

      {activeFeature === 'register-member' && (
        <RegisterMemberView onSuccess={() => handleSelectFeature('search-members')} />
      )}

      {activeFeature === 'manage-memberships' && <ManageMembershipsView />}
    </ReceptionistLayout>
  );
};

export default ReceptionistDashboard;