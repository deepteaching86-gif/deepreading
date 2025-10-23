/**
 * English Test Page
 * =================
 *
 * Wrapper page for the English Adaptive Test
 */

import { useAuthStore } from '@/stores/authStore';
import { EnglishTestContainer } from '@/components/english-test/EnglishTestContainer';

export default function EnglishTestPage() {
  const { user } = useAuthStore();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">로그인이 필요합니다.</p>
      </div>
    );
  }

  return <EnglishTestContainer userId={user.id} />;
}
