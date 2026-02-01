import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '@/components/ui';

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const token = localStorage.getItem('token'); // Assume token is stored
      const res = await fetch('/api/admin/templates', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setTemplates(data.data || []);
    } catch (error) {
      console.error('Failed to load templates', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleEnabled = async (id: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/admin/templates/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ enabled: !currentStatus })
      });
      loadTemplates();
    } catch (error) {
      alert('Update failed');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">⚙️ 任務模板管理</h1>
      
      <Card className="p-0 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4">人設</th>
              <th className="p-4">任務類型</th>
              <th className="p-4">時間</th>
              <th className="p-4">頻率</th>
              <th className="p-4">狀態</th>
              <th className="p-4">操作</th>
            </tr>
          </thead>
          <tbody>
            {templates.map(t => (
              <tr key={t.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="p-4 font-medium">{t.personas?.name}</td>
                <td className="p-4 text-gray-600">{t.task_type}</td>
                <td className="p-4">{t.time_slot}</td>
                <td className="p-4">
                  <Badge variant="gray">{t.frequency}</Badge>
                </td>
                <td className="p-4">
                  <Badge variant={t.enabled ? 'green' : 'red'}>
                    {t.enabled ? '啟用' : '停用'}
                  </Badge>
                </td>
                <td className="p-4">
                  <Button 
                    size="sm" 
                    variant={t.enabled ? 'outline' : 'primary'}
                    onClick={() => toggleEnabled(t.id, t.enabled)}
                  >
                    {t.enabled ? '停用' : '啟用'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
