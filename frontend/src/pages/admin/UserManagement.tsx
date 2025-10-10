import { useState, useEffect } from 'react';
import axios from '../../lib/axios';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'teacher' | 'parent' | 'admin';
  phone?: string;
  createdAt: string;
  student?: {
    id: string;
    grade: number;
    schoolName?: string;
    parentPhone?: string;
  };
}

interface EditUserData {
  name: string;
  email: string;
  phone?: string;
  grade?: number;
  schoolName?: string;
  parentPhone?: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editData, setEditData] = useState<EditUserData>({
    name: '',
    email: '',
    phone: '',
  });
  const [filterRole, setFilterRole] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/v1/admin/users');
      setUsers(response.data.data || []);
    } catch (error) {
      console.error('사용자 목록 조회 실패:', error);
      alert('사용자 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setEditData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      grade: user.student?.grade,
      schoolName: user.student?.schoolName || '',
      parentPhone: user.student?.parentPhone || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    try {
      await axios.put(`/api/v1/admin/users/${editingUser.id}`, editData);
      alert('사용자 정보가 수정되었습니다.');
      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error('사용자 정보 수정 실패:', error);
      alert(error.response?.data?.message || '사용자 정보 수정에 실패했습니다.');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('정말로 이 사용자를 삭제하시겠습니까?')) return;

    try {
      await axios.delete(`/api/v1/admin/users/${userId}`);
      alert('사용자가 삭제되었습니다.');
      fetchUsers();
    } catch (error: any) {
      console.error('사용자 삭제 실패:', error);
      alert(error.response?.data?.message || '사용자 삭제에 실패했습니다.');
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers(new Set());
    } else {
      const allUserIds = new Set(filteredUsers.map(u => u.id));
      setSelectedUsers(allUserIds);
    }
    setSelectAll(!selectAll);
  };

  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
    setSelectAll(newSelected.size === filteredUsers.length);
  };

  const handleDeleteSelected = async () => {
    if (selectedUsers.size === 0) {
      alert('삭제할 사용자를 선택해주세요.');
      return;
    }

    if (!confirm(`선택한 ${selectedUsers.size}명의 사용자를 삭제하시겠습니까?`)) return;

    try {
      const deletePromises = Array.from(selectedUsers).map(userId =>
        axios.delete(`/api/v1/admin/users/${userId}`)
      );
      await Promise.all(deletePromises);
      alert(`${selectedUsers.size}명의 사용자가 삭제되었습니다.`);
      setSelectedUsers(new Set());
      setSelectAll(false);
      fetchUsers();
    } catch (error: any) {
      console.error('일괄 삭제 실패:', error);
      alert('일부 사용자 삭제에 실패했습니다.');
      fetchUsers();
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      student: '학생',
      teacher: '교사',
      parent: '학부모',
      admin: '관리자',
    };
    return labels[role] || role;
  };

  const filteredUsers = users.filter((user) => {
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">전체 회원 관리</h1>
          <p className="text-muted-foreground mt-2">모든 사용자의 정보를 조회하고 관리합니다.</p>
        </div>

      {/* Filters */}
      <div className="bg-card rounded-lg shadow p-4 border border-border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-2">역할 필터</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-input text-foreground"
            >
              <option value="all">전체</option>
              <option value="student">학생</option>
              <option value="teacher">교사</option>
              <option value="parent">학부모</option>
              <option value="admin">관리자</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-2">검색</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="이름 또는 이메일로 검색"
              className="w-full px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-input text-foreground"
            />
          </div>
        </div>
      </div>

      {/* User Count & Bulk Actions */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          총 {filteredUsers.length}명의 사용자
          {selectedUsers.size > 0 && (
            <span className="ml-2 text-primary font-medium">
              ({selectedUsers.size}명 선택됨)
            </span>
          )}
        </div>
        {selectedUsers.size > 0 && (
          <button
            onClick={handleDeleteSelected}
            className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors font-medium"
          >
            선택한 회원 삭제 ({selectedUsers.size})
          </button>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-card rounded-lg shadow overflow-hidden border border-border">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <table className="w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  이름
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  이메일
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  역할
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  전화번호
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  추가 정보
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  가입일
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                      className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-foreground">{user.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary/10 text-primary">
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {user.phone || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {user.student ? (
                      <div className="space-y-1">
                        <div>학년: {user.student.grade}</div>
                        {user.student.schoolName && <div>학교: {user.student.schoolName}</div>}
                        {user.student.parentPhone && <div>학부모: {user.student.parentPhone}</div>}
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEditClick(user)}
                      className="text-primary hover:text-primary/80 transition-colors"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-destructive hover:text-destructive/80 transition-colors"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-lg shadow-xl p-6 max-w-md w-full border border-border">
            <h2 className="text-xl font-bold text-card-foreground mb-4">사용자 정보 수정</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">이름</label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-input text-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">이메일</label>
                <input
                  type="email"
                  value={editData.email}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-input text-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">전화번호</label>
                <input
                  type="tel"
                  value={editData.phone}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-input text-foreground"
                  placeholder="010-1234-5678"
                />
              </div>

              {editingUser.role === 'student' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-card-foreground mb-1">학년</label>
                    <select
                      value={editData.grade}
                      onChange={(e) => setEditData({ ...editData, grade: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-input text-foreground"
                    >
                      {[1, 2, 3, 4, 5, 6].map((grade) => (
                        <option key={grade} value={grade}>
                          초등 {grade}학년
                        </option>
                      ))}
                      {[7, 8, 9].map((grade) => (
                        <option key={grade} value={grade}>
                          중등 {grade - 6}학년
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-card-foreground mb-1">학교명</label>
                    <input
                      type="text"
                      value={editData.schoolName}
                      onChange={(e) => setEditData({ ...editData, schoolName: e.target.value })}
                      className="w-full px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-input text-foreground"
                      placeholder="예: 서울초등학교"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-card-foreground mb-1">
                      학부모 휴대폰 번호
                    </label>
                    <input
                      type="tel"
                      value={editData.parentPhone}
                      onChange={(e) => setEditData({ ...editData, parentPhone: e.target.value })}
                      className="w-full px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-input text-foreground"
                      placeholder="010-1234-5678"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors text-foreground"
              >
                취소
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
