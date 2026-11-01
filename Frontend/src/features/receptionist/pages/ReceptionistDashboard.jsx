import { useLanguage } from '../../../i18n/useLanguage';
import React, { useState, useEffect, useCallback } from 'react';
import ReceptionistLayout from '../../../layouts/ReceptionistLayout';
import MemberManagementView from '../components/MemberManagementView';
import RegisterMemberView from '../components/RegisterMemberView';
import ManageMembershipsView from '../components/ManageMembershipsView';
import MemberCheckInView from '../components/MemberCheckInView';
import InvoiceManagementView from '../components/InvoiceManagementView';
import SupportDeskView from '../components/SupportDeskView';
import LostAndFoundView from '../components/LostAndFoundView';
import ReceptionistNotificationsView from '../components/ReceptionistNotificationsView';
import ReceptionistSettingsView from '../components/ReceptionistSettingsView';

const ReceptionistDashboard = () => {
  useLanguage();
  const [activeFeature, setActiveFeature] = useState('search-members');
  const [checkinMemberId, setCheckinMemberId] = useState(null);
  const [featureParams, setFeatureParams] = useState({});

  const handleSelectFeature = useCallback((featureId, params = {}) => {
    setFeatureParams(params || {});
    setActiveFeature((prev) => {
      if (prev !== featureId) {
        window.history.pushState({ receptionistTab: featureId, featureParams: params }, '');
      }
      return featureId;
    });
  }, []);

  const handleQuickCheckIn = useCallback((userId) => {
    setCheckinMemberId(userId);
    handleSelectFeature('member-checkin', { memberId: userId });
  }, [handleSelectFeature]);

  useEffect(() => {
    if (!window.history.state?.receptionistTab && !window.history.state?.nexusModal) {
      window.history.replaceState({ receptionistTab: 'search-members' }, '');
    }
    const handlePopState = (event) => {
      if (event.state?.receptionistTab) {
        setActiveFeature(event.state.receptionistTab);
        setFeatureParams(event.state.featureParams || {});
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <ReceptionistLayout activeFeature={activeFeature} onSelectFeature={handleSelectFeature}>
      {activeFeature === 'search-members' && (
        <MemberManagementView
          initialKeyword={featureParams.searchKeyword || ''}
          onQuickCheckIn={handleQuickCheckIn}
        />
      )}

      {activeFeature === 'member-checkin' && (
        <MemberCheckInView
          initialMemberId={featureParams.memberId || checkinMemberId}
          initialHistoryKeyword={featureParams.historyKeyword || ''}
          initialHistoryFilter={featureParams.historyStatusFilter || 'ALL'}
          onSwitchToRenew={() => handleSelectFeature('manage-memberships')}
        />
      )}

      {activeFeature === 'register-member' && (
        <RegisterMemberView onSuccess={() => handleSelectFeature('search-members')} />
      )}

      {activeFeature === 'manage-memberships' && (
        <ManageMembershipsView initialKeyword={featureParams.keyword || featureParams.searchKeyword || ''} />
      )}

      {activeFeature === 'manage-invoices' && (
        <InvoiceManagementView initialKeyword={featureParams.searchKeyword || ''} />
      )}
      {activeFeature === 'support-desk' && (
        <SupportDeskView initialKeyword={featureParams.searchKeyword || ''} />
      )}
      {activeFeature === 'lost-and-found' && (
        <LostAndFoundView initialKeyword={featureParams.keyword || ''} />
      )}
      {activeFeature === 'notifications' && (
        <ReceptionistNotificationsView onNavigateFeature={handleSelectFeature} />
      )}
      {activeFeature === 'settings' && <ReceptionistSettingsView />}
    </ReceptionistLayout>
  );
};

export default ReceptionistDashboard;
