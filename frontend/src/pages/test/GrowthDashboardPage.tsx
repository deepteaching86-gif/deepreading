/**
 * Growth Dashboard Page
 * =====================
 *
 * Page wrapper for the Growth Dashboard component.
 * Fetches growth data and passes to the dashboard.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGrowthData, GrowthData } from '@/api/englishTestApi';
import { GrowthDashboard } from '@/components/english-test/GrowthDashboard';

const GrowthDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<GrowthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get user ID from localStorage (matches existing auth pattern)
        const userStr = localStorage.getItem('user');
        if (!userStr) {
          setError('User not found. Please log in again.');
          setLoading(false);
          return;
        }
        const user = JSON.parse(userStr);
        const userId = user.id || user.uid || user.user_id;

        if (!userId) {
          setError('User ID not found.');
          setLoading(false);
          return;
        }

        const growthData = await getGrowthData(userId);
        setData(growthData);
      } catch (err) {
        console.error('Failed to fetch growth data:', err);
        setError('Failed to load growth data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading growth data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <GrowthDashboard
      data={data}
      onBack={() => navigate('/dashboard')}
    />
  );
};

export default GrowthDashboardPage;
