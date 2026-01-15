import { useState, useCallback } from 'react';
import { businessService } from '../services/supabase/business';
import { Business, BusinessFilters } from '../types/business';

export const useBusiness = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);

  const getBusinesses = useCallback(async (filters?: BusinessFilters) => {
    try {
      setLoading(true);
      const data = await businessService.getBusinesses(filters);
      setBusinesses(data);
      return data;
    } catch (error) {
      console.error('Error getting businesses:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createBusiness = useCallback(async (businessData: any) => {
    try {
      setLoading(true);
      const businessId = await businessService.createBusiness(businessData);
      await getBusinesses(); // Refresh list
      return businessId;
    } catch (error) {
      console.error('Error creating business:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getBusinesses]);

  const addReview = useCallback(async (businessId: string, rating: number, comment?: string) => {
    try {
      const result = await businessService.addReview(businessId, rating, comment);
      
      // Update local state
      setBusinesses(prev => prev.map(business => {
        if (business.id === businessId) {
          return {
            ...business,
            average_rating: result.average_rating,
            review_count: result.review_count
          };
        }
        return business;
      }));
      
      return result;
    } catch (error) {
      console.error('Error adding review:', error);
      throw error;
    }
  }, []);

  const deleteBusiness = useCallback(async (businessId: string) => {
    try {
      await businessService.deleteBusiness(businessId);
      setBusinesses(prev => prev.filter(b => b.id !== businessId));
    } catch (error) {
      console.error('Error deleting business:', error);
      throw error;
    }
  }, []);

  return {
    businesses,
    loading,
    getBusinesses,
    createBusiness,
    addReview,
    deleteBusiness,
    setBusinesses
  };
};