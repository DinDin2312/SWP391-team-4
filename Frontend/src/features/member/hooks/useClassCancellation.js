import { useState, useCallback } from 'react';
import memberService from '../services/memberService';
import { t } from '../../../i18n/useLanguage';

export const useClassCancellation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);

  const loadPreview = useCallback(async (classId) => {
    if (!classId) {
      setPreview(null);
      setError('');
      return null;
    }
    try {
      setLoading(true);
      setError('');
      const data = await memberService.getCancelClassPreview(classId);
      setPreview(data);
      return data;
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.message || t('Failed to load cancellation policy preview.');
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const executeDirectCancel = useCallback(async (classId) => {
    try {
      setLoading(true);
      setError('');
      const res = await memberService.cancelClassDirectly(classId);
      const resultObj = {
        type: 'DIRECT_CANCEL_SUCCESS',
        requestId: res.requestId,
        creditCode: res.creditCode,
        creditAmount: res.creditAmount,
        expiryDate: res.expiryDate,
        message: res.message
      };
      return { success: true, data: resultObj };
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.message || t('Failed to cancel class.');
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError('');
    setPreview(null);
  }, []);

  return {
    loading,
    error,
    setError,
    preview,
    setPreview,
    loadPreview,
    executeDirectCancel,
    reset
  };
};

export default useClassCancellation;
