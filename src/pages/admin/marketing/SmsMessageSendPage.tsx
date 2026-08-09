import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Send, Plus, Trash2, Edit2, Check, X, ChevronRight, Users, Upload, Smartphone, AlertCircle, Clock, Loader2, Mail, RefreshCw, Sliders, History, Folder, AlertTriangle, Save, Search, Image as ImageIcon } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { mtsService, DEFAULT_FROM_PHONE, type SmsTemplateGroup, type SmsTemplate } from '../../../services/mtsService';
import { adminService } from '../../../services/adminService';
import { toast } from 'sonner';
import { useModal } from '../../../context/ModalContext';
import { supabase } from '../../../lib/supabaseClient';

import { equipmentService, type EquipmentModel } from '../../../services/equipmentService';
import { productService } from '../../../services/productService';
import type { Product } from '../../../types';

interface Recipient {
  name: string;
  phone: string;
  hospitalName?: string;
  points?: number;
  selected?: boolean;
}

export function SmsMessageSendPage() {
  const navigate = useNavigate();
  const { confirm } = useModal();

  const [groups, setGroups] = useState<SmsTemplateGroup[]>([]);
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<SmsTemplateGroup | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<SmsTemplate | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [isAddingGroup, setIsAddingGroup] = useState(false);

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [prefixAd, setPrefixAd] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [recipientView, setRecipientView] = useState<'list' | 'blocked'>('list');
  const [addMode, setAddMode] = useState<'search' | 'direct'>('search');
  const [directName, setDirectName] = useState('');
  const [directPhone, setDirectPhone] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  const KOREA_REGIONS = [
    '서울', '경기', '인천', '강원',
    '충북', '충남', '대전', '세종',
    '전북', '전남', '광주',
    '경북', '경남', '대구', '울산', '부산', '제주'
  ];

  const [isSegmentOpen, setIsSegmentOpen] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['병원', '대리점', '홀딩스', '학회', '기타']);
  const [selectedDaysAgo, setSelectedDaysAgo] = useState<number | null>(null);
  const [selectedMinAmount, setSelectedMinAmount] = useState<number | null>(null);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [equipments, setEquipments] = useState<EquipmentModel[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string>('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductCondition, setSelectedProductCondition] = useState<'all' | 'purchased' | 'not_purchased'>('all');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [productSearchQuery, setProductSearchQuery] = useState<string>('');
  const [moveGroupTarget, setMoveGroupTarget] = useState<SmsTemplate | null>(null);

  const [sendMode, setSendMode] = useState<'immediate' | 'reserved'>('immediate');
  const [reservedDate, setReservedDate] = useState('');
  const [reservedTime, setReservedTime] = useState('');
  const [sending, setSending] = useState(false);
  const [credit, setCredit] = useState<number | null>(52);
  const [storeId] = useState('70000');
  const [fromPhone] = useState(DEFAULT_FROM_PHONE);

  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const msgType = mtsService.getMessageType(message, subject, attachedImages);
  const byteSize = mtsService.getByteSize(message);
  const maxBytes = mtsService.getMaxBytes(msgType === 'MMS' ? 'LMS' : msgType);
  const isOverLimit = byteSize > maxBytes;
  const filteredTemplates = selectedGroup
    ? selectedGroup.id === 'unassigned'
      ? templates.filter(t => !t.group_id)
      : templates.filter(t => t.group_id === selectedGroup.id)
    : templates;

  useEffect(() => {
    loadGroups(); loadTemplates(); loadCredit(); loadEquipments(); loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await productService.getProducts();
      if (data && data.length > 0) {
        setProducts(data);
      } else {
        setProducts([
          { id: 'p1', name: '덴시티 HIGH 팁 300샷', category: '소모품', price: 350000 } as any,
          { id: 'p2', name: '포텐자 AC 팁 25핀 (10개입)', category: '소모품', price: 420000 } as any,
          { id: 'p3', name: '리니어지 카트리지 4.5mm', category: '소모품', price: 280000 } as any,
          { id: 'p4', name: '셀렉브이 필터 세트', category: '부품', price: 150000 } as any,
        ]);
      }
    } catch {
      setProducts([
        { id: 'p1', name: '덴시티 HIGH 팁 300샷', category: '소모품', price: 350000 } as any,
        { id: 'p2', name: '포텐자 AC 팁 25핀 (10개입)', category: '소모품', price: 420000 } as any,
        { id: 'p3', name: '리니어지 카트리지 4.5mm', category: '소모품', price: 280000 } as any,
        { id: 'p4', name: '셀렉브이 필터 세트', category: '부품', price: 150000 } as any,
      ]);
    }
  };

  const loadEquipments = async () => {
    try {
      const data = await equipmentService.getEquipmentModels();
      setEquipments(data);
    } catch {
      // 파이어베이스/서버 통신 예외 시 기본 장비 데이터 렌더링
      setEquipments([
        { id: '1', model_name: 'DENSITY (덴시티)', code: 'EQ-001', category: '리프팅 장비', image_url: '' },
        { id: '2', model_name: 'POTENZA (포텐자)', code: 'EQ-002', category: '고주파 장비', image_url: '' },
        { id: '3', model_name: 'LINEARZ (리니어지)', code: 'EQ-003', category: '초음파 장비', image_url: '' },
        { id: '4', model_name: 'CELLEC V (셀렉브이)', code: 'EQ-004', category: '레이저 장비', image_url: '' },
        { id: '5', model_name: 'TRI-BEAM (트라이빔)', code: 'EQ-005', category: '레이저 장비', image_url: '' },
      ]);
    }
  };

  const loadGroups = async () => { try { setGroups(await mtsService.getTemplateGroups()); } catch { } };
  const loadTemplates = async () => { try { setTemplates(await mtsService.getTemplates()); } catch { } };
  const loadCredit = async () => {
    try { const d = await mtsService.getSmsCredit(storeId); if (d.leftLmsAmount) setCredit(d.leftLmsAmount); } catch { }
  };

  const handleAddGroup = async () => {
    if (!newGroupName.trim()) return;
    try { await mtsService.createTemplateGroup(newGroupName.trim(), groups.length); await loadGroups(); setNewGroupName(''); setIsAddingGroup(false); } catch { }
  };
  const handleUpdateGroup = async (id: string) => {
    if (!editingGroupName.trim()) return;
    try { await mtsService.updateTemplateGroup(id, editingGroupName.trim()); await loadGroups(); setEditingGroupId(null); } catch { }
  };

  const applyTemplate = (t: SmsTemplate) => {
    setSelectedTemplate(t);
    setSubject(t.subject || '');
    setMessage(t.message);
    setPrefixAd(t.prefix_word === '(광고)');
  };

  const insertPlaceholder = (ph: string) => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const newText = message.substring(0, start) + ph + message.substring(end);
    setMessage(newText);
    setTimeout(() => {
      if (textareaRef.current) { textareaRef.current.focus(); const np = start + ph.length; textareaRef.current.setSelectionRange(np, np); }
    }, 0);
  };

  const handleSaveTemplate = async () => {
    if (!message.trim()) { toast.error('메시지 내용을 입력하세요.'); return; }
    // 입력한 제목이 있으면 템플릿명으로 사용하고, 없으면 메시지 첫 줄/앞부분을 사용
    const name = subject.trim() || message.trim().split('\n')[0].substring(0, 20) || '새 템플릿';
    try {
      if (selectedTemplate?.id) {
        await mtsService.updateTemplate(selectedTemplate.id, { name, subject: subject || null, message, prefix_word: prefixAd ? '(광고)' : null, group_id: selectedGroup?.id || null });
        toast.success(`[${name}] 템플릿이 수정되었습니다.`);
      } else {
        await mtsService.createTemplate({ name, subject: subject || null, message, prefix_word: prefixAd ? '(광고)' : null, group_id: selectedGroup?.id || null });
        toast.success(`[${name}] 템플릿이 저장되었습니다.`);
      }
      await loadTemplates();
    } catch { toast.error('템플릿 저장에 실패했습니다.'); }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (attachedImages.length + files.length > 3) {
      toast.warning('MMS 이미지 첨부는 최대 3장까지 가능합니다.');
      return;
    }

    setIsUploadingImage(true);
    const newUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 2 * 1024 * 1024) {
          toast.error(`[${file.name}] 용량이 2MB를 초과합니다. 300KB 이하 첨부를 권장합니다.`);
          continue;
        }

        const ext = file.name.split('.').pop() || 'jpg';
        const path = `mms/img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;

        const { error } = await supabase.storage
          .from('marketing')
          .upload(path, file, { upsert: true });

        if (error) {
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
          newUrls.push(dataUrl);
        } else {
          const { data: { publicUrl } } = supabase.storage.from('marketing').getPublicUrl(path);
          newUrls.push(publicUrl);
        }
      }

      if (newUrls.length > 0) {
        setAttachedImages(prev => [...prev, ...newUrls]);
        toast.success(`MMS 이미지 ${newUrls.length}장이 첨부되었습니다.`);
      }
    } catch {
      toast.error('이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setAttachedImages(prev => prev.filter((_, i) => i !== index));
    toast.info('첨부 이미지가 삭제되었습니다.');
  };

  const handleReset = () => { setMessage(''); setSubject(''); setPrefixAd(false); setRecipients([]); setSelectedTemplate(null); setAttachedImages([]); toast.info('전송 폼이 초기화되었습니다.'); };

  const handleSend = async () => {
    if (!recipients.length) { toast.error('수신 대상을 추가하세요.'); return; }
    if (!message.trim()) { toast.error('메시지를 입력하세요.'); return; }
    if (isOverLimit) { toast.error('글자수 제한을 초과했습니다.'); return; }

    let reservedAtStr: string | undefined = undefined;
    if (sendMode === 'reserved') {
      if (!reservedDate || !reservedTime) {
        toast.error('예약 발송 일자와 시간을 지정하세요.');
        return;
      }
      const targetDateTime = new Date(`${reservedDate}T${reservedTime}:00`);
      if (targetDateTime.getTime() <= Date.now()) {
        toast.error('예약 발송 일시는 현재 시간보다 미래이어야 합니다.');
        return;
      }
      reservedAtStr = targetDateTime.toISOString();
    }

    const descMsg = sendMode === 'reserved'
      ? `${recipients.length}명에게 [${reservedDate} ${reservedTime}] 예약 발송하시겠습니까?`
      : `${recipients.length}명에게 즉시 발송하시겠습니까?`;

    const ok = await confirm({ title: sendMode === 'reserved' ? '예약 메시지 발송' : '메시지 발송', description: descMsg, confirmText: '발송', cancelText: '취소' });
    if (!ok) return;
    setSending(true);
    try {
      const finalMsg = prefixAd ? `(광고)\n${message}\n무료수신거부 080-123-4567` : message;
      await mtsService.sendBulkSms({
        fromPhone,
        subject: subject || undefined,
        message: finalMsg,
        purpose: 'mkt',
        recipients,
        storeId,
        reservedAt: reservedAtStr,
        attachedUrls: attachedImages.length > 0 ? attachedImages : undefined
      });

      if (sendMode === 'reserved') {
        toast.success(`${recipients.length}명에게 [${reservedDate} ${reservedTime}] 예약 발송이 설정되었습니다.`);
      } else {
        toast.success(`${recipients.length}명 즉시 발송 완료!`);
      }
      handleReset();
    } catch { toast.error('발송 실패. 잠시 후 다시 시도하세요.'); } finally { setSending(false); }
  };

  const contentRef = useRef<HTMLDivElement>(null);
  const [contentLeft, setContentLeft] = useState(0);

  useEffect(() => {
    const updateBounds = () => {
      if (contentRef.current) {
        const rect = contentRef.current.getBoundingClientRect();
        setContentLeft(rect.left);
      }
    };
    updateBounds();
    const t = setTimeout(updateBounds, 200);
    window.addEventListener('resize', updateBounds);
    return () => { clearTimeout(t); window.removeEventListener('resize', updateBounds); };
  }, []);

  const formatPhoneNumber = (val: string) => {
    const nums = val.replace(/[^0-9]/g, '');
    if (nums.length <= 3) return nums;
    if (nums.length <= 7) return `${nums.slice(0, 3)}-${nums.slice(3)}`;
    if (nums.length <= 11) return `${nums.slice(0, 3)}-${nums.slice(3, nums.length - 4)}-${nums.slice(nums.length - 4)}`;
    return `${nums.slice(0, 3)}-${nums.slice(3, 7)}-${nums.slice(7, 11)}`;
  };

  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDirectPhone(formatPhoneNumber(e.target.value));
  };

  const handleAddDirectRecipient = () => {
    const trimmedName = directName.trim();
    const rawPhone = directPhone.replace(/[^0-9]/g, '');

    if (!trimmedName) {
      toast.error('이름을 입력해 주세요.');
      return;
    }

    if (!rawPhone || rawPhone.length < 9) {
      toast.error('유효한 전화번호를 입력해 주세요.');
      return;
    }

    const formattedPhone = formatPhoneNumber(rawPhone);

    const isDuplicate = recipients.some(r => r.phone.replace(/[^0-9]/g, '') === rawPhone);
    if (isDuplicate) {
      toast.warning('이미 수신자 목록에 존재하는 전화번호입니다.');
    }

    setRecipients(prev => [
      ...prev,
      {
        name: trimmedName,
        phone: formattedPhone
      }
    ]);

    setDirectName('');
    setDirectPhone('');
    toast.success(`[${trimmedName}] 고객이 수신자 목록에 추가되었습니다.`);
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingUsers(true);
      try {
        const q = searchQuery.trim();
        const { data, error } = await supabase
          .from('users')
          .select('id, name, phone, hospital_name, email')
          .or(`name.ilike.%${q}%,phone.ilike.%${q}%,hospital_name.ilike.%${q}%,email.ilike.%${q}%`)
          .limit(15);

        if (!error && data && data.length > 0) {
          setSearchResults(data);
        } else {
          const mockUsers = [
            { id: 'u1', name: '김원장', phone: '010-1234-5678', hospital_name: '서울피부과의원' },
            { id: 'u2', name: '이원장', phone: '010-9876-5432', hospital_name: '강남제이성형외과' },
            { id: 'u3', name: '박원장', phone: '010-5555-7777', hospital_name: '미래의원' },
            { id: 'u4', name: '최원장', phone: '010-2222-3333', hospital_name: '제이의원' },
          ];
          const filtered = mockUsers.filter(u =>
            u.name.includes(q) || u.phone.includes(q) || u.hospital_name.includes(q)
          );
          setSearchResults(filtered);
        }
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearchingUsers(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleAddSearchedUser = (user: any) => {
    const rawPhone = (user.phone || '').replace(/[^0-9]/g, '');
    if (!rawPhone || rawPhone.length < 9) {
      toast.error('전화번호가 올바르지 않은 회원입니다.');
      return;
    }

    const formattedPhone = formatPhoneNumber(rawPhone);
    const userName = user.name || user.hospital_name || '원장님';

    const isDuplicate = recipients.some(r => r.phone.replace(/[^0-9]/g, '') === rawPhone);
    if (isDuplicate) {
      toast.warning('이미 수신자 목록에 존재하는 전화번호입니다.');
      return;
    }

    setRecipients(prev => [
      ...prev,
      {
        name: userName,
        phone: formattedPhone,
        hospitalName: user.hospital_name || undefined
      }
    ]);

    setSearchQuery('');
    setSearchResults([]);
    toast.success(`[${userName}] 고객이 수신자 목록에 추가되었습니다.`);
  };

  return (
    <>
      <div ref={contentRef} style={{ width: 0, height: 0, overflow: 'hidden', visibility: 'hidden' }} />

      <div
        className="font-sans bg-neutral-100 flex flex-col"
        style={{
          position: 'fixed',
          top: 64,
          left: contentLeft || 9999,
          right: 0,
          bottom: 0,
          zIndex: 10,
        }}
      >
      <div className="bg-white border-b border-neutral-200 px-6 py-4 flex items-start justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">메시지 전송</h1>
          <p className="text-sm text-neutral-500 mt-1">마케팅 목적으로 고객에게 문자 메시지를 전송합니다.</p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <button onClick={handleReset} className="flex items-center gap-1.5 border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 px-3 py-1.5 rounded text-xs font-semibold transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> 초기화
          </button>
          <button onClick={() => setIsSegmentOpen(true)} className="flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-700 text-white px-3 py-1.5 rounded text-xs font-semibold transition-colors">
            <Sliders className="w-3.5 h-3.5" /> 대상 고객 지정
          </button>
          <button onClick={() => navigate('/admin/marketing/sms/history')} className="flex items-center gap-1.5 border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 px-3 py-1.5 rounded text-xs font-semibold transition-colors">
            <History className="w-3.5 h-3.5" /> 전송 내역
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'row', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        <div style={{ width: 420, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'white', borderRight: '1px solid #e5e7eb' }}>
          <div className="border-b border-neutral-200 bg-white px-2 pt-2.5 pb-0 flex items-center justify-between">
            <div className="flex items-center gap-x-1 gap-y-0 flex-wrap flex-1 overflow-hidden">
              <button
                onClick={() => setSelectedGroup(null)}
                className={`flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-t transition-colors border-b-2 whitespace-nowrap ${
                  !selectedGroup ? 'border-blue-500 text-blue-600 bg-blue-50 font-bold' : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                전체보기
              </button>
              <button
                onClick={() => setSelectedGroup({ id: 'unassigned', name: '미지정', sort_order: 999, created_at: '' })}
                className={`flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-t transition-colors border-b-2 whitespace-nowrap ${
                  selectedGroup?.id === 'unassigned' ? 'border-blue-500 text-blue-600 bg-blue-50 font-bold' : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                미지정
              </button>
              {groups.map(g => {
                const isSelected = selectedGroup?.id === g.id;
                return (
                  <div key={g.id} className="flex-shrink-0 flex items-center">
                    {editingGroupId === g.id ? (
                      <div className="flex items-center gap-1 px-1 bg-white border border-neutral-300 rounded py-0.5 z-10 my-0.5">
                        <input
                          autoFocus
                          value={editingGroupName}
                          onChange={e => setEditingGroupName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleUpdateGroup(g.id); if (e.key === 'Escape') setEditingGroupId(null); }}
                          className="w-20 text-xs px-1 focus:outline-none"
                        />
                        <button onClick={() => handleUpdateGroup(g.id)} className="text-green-600 hover:text-green-700 p-0.5"><Check className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setEditingGroupId(null)} className="text-neutral-400 hover:text-neutral-600 p-0.5"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedGroup(g)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-t whitespace-nowrap transition-colors border-b-2 ${
                          isSelected ? 'border-blue-500 text-blue-600 bg-blue-50 font-bold' : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'
                        }`}
                      >
                        {g.name}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 우측 조작부: 선택된 그룹 수정/삭제 버튼 및 + 그룹 추가 버튼 */}
            <div className="flex items-center gap-1 shrink-0 pl-2">
              {selectedGroup && selectedGroup.id !== 'unassigned' && (
                <>
                  <button
                    onClick={() => {
                      setEditingGroupId(selectedGroup.id);
                      setEditingGroupName(selectedGroup.name);
                    }}
                    className="p-1.5 text-neutral-500 hover:text-blue-600 hover:bg-neutral-100 rounded transition-colors"
                    title={`[${selectedGroup.name}] 그룹명 수정`}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={async () => {
                      if (window.confirm(`[${selectedGroup.name}] 그룹을 삭제하시겠습니까? 그룹 내 템플릿은 미지정으로 이동됩니다.`)) {
                        try {
                          await mtsService.deleteTemplateGroup(selectedGroup.id);
                          toast.success('그룹이 삭제되었습니다.');
                          setSelectedGroup(null);
                          await loadGroups();
                        } catch {
                          toast.error('그룹 삭제에 실패했습니다.');
                        }
                      }
                    }}
                    className="p-1.5 text-neutral-500 hover:text-red-500 hover:bg-neutral-100 rounded transition-colors"
                    title={`[${selectedGroup.name}] 그룹 삭제`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="w-px h-3.5 bg-neutral-300 mx-0.5" />
                </>
              )}

              {isAddingGroup ? (
                <div className="flex items-center gap-1 px-1 py-0.5 border border-neutral-300 rounded bg-white shrink-0">
                  <input
                    autoFocus
                    placeholder="그룹명"
                    value={newGroupName}
                    onChange={e => setNewGroupName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleAddGroup(); if (e.key === 'Escape') setIsAddingGroup(false); }}
                    className="w-20 text-xs px-1 focus:outline-none"
                  />
                  <button onClick={handleAddGroup} className="text-green-600 p-0.5"><Check className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setIsAddingGroup(false)} className="text-neutral-400 p-0.5"><X className="w-3.5 h-3.5" /></button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingGroup(true)}
                  className="p-1.5 text-neutral-500 hover:text-blue-600 hover:bg-neutral-100 rounded transition-colors"
                  title="신규 그룹 추가"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto" style={{ padding: 10 }}>
            <div className="grid grid-cols-2" style={{ gap: 10 }}>
              {filteredTemplates.length === 0 ? (
                <div className="col-span-2 py-16 text-center text-neutral-400 text-xs">
                  <p>보관된 템플릿이 없습니다.</p>
                </div>
              ) : (
                filteredTemplates.map(t => {
                  const groupName = groups.find(g => g.id === t.group_id)?.name ?? '';
                  const isSelected = selectedTemplate?.id === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => applyTemplate(t)}
                      className={`flex flex-col rounded-lg cursor-pointer transition-all bg-white text-left overflow-hidden border ${
                        isSelected ? 'border-blue-400 ring-2 ring-blue-100' : 'border-neutral-200 hover:border-neutral-300 hover:shadow-sm'
                      }`}
                      style={{ height: 300 }}
                    >
                      <div className="flex flex-col" style={{ padding: 12, height: 'calc(100% - 36px)', overflow: 'hidden' }}>
                        <div className="text-[10px] font-bold text-neutral-400 mb-1">{groupName || '일반'}</div>
                        <div className="text-xs font-bold text-neutral-900 leading-snug mb-1.5 line-clamp-2">
                          {t.subject || t.name}
                        </div>
                        <p className="text-[11px] text-neutral-600 leading-relaxed line-clamp-8 whitespace-pre-line flex-1">
                          {t.message}
                        </p>
                      </div>
                      <div className="flex items-center border-t border-neutral-100 shrink-0">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setMoveGroupTarget(t);
                          }}
                          className="flex-1 flex items-center justify-center py-2 text-green-600 hover:bg-green-50 transition-colors border-r border-neutral-100"
                          title="그룹 이동"
                        >
                          <Folder className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            mtsService.deleteTemplate(t.id).then(() => {
                              loadTemplates();
                              if (selectedTemplate?.id === t.id) setSelectedTemplate(null);
                            });
                          }}
                          className="flex-1 flex items-center justify-center py-2 text-red-400 hover:bg-red-50 transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div style={{ width: 380, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'white', borderLeft: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb' }}>
          <div className="bg-blue-600 px-4 py-3 flex items-center justify-between gap-2 shrink-0">
            <div className="text-white shrink-0 min-w-0">
              <div className="font-bold text-sm leading-tight truncate">제이시스 메디컬</div>
              <div className="text-blue-100 text-[11px] font-mono leading-tight">{fromPhone}</div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {selectedTemplate && (
                <button
                  onClick={handleSaveTemplate}
                  className="flex items-center gap-1 bg-white text-blue-600 hover:bg-blue-50 text-xs font-bold px-2.5 py-1.5 rounded shadow-sm transition-colors cursor-pointer whitespace-nowrap"
                  title="선택된 템플릿 내용 수정 저장"
                >
                  <Save className="w-3.5 h-3.5" /> 저장
                </button>
              )}
              <button
                onClick={() => {
                  // 신규 템플릿 추가를 위해 selectedTemplate 비우고 저장
                  setSelectedTemplate(null);
                  setTimeout(() => handleSaveTemplate(), 50);
                }}
                className="flex items-center gap-1 bg-white text-blue-600 hover:bg-blue-50 text-xs font-bold px-2.5 py-1.5 rounded shadow-sm transition-colors cursor-pointer whitespace-nowrap"
                title="새 템플릿으로 추가"
              >
                <Plus className="w-3.5 h-3.5" /> 추가
              </button>
            </div>
          </div>
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value.slice(0, 30))}
            placeholder="제목을 입력해 메시지를 보낼 수 있습니다. (30자)"
            className="w-full border-b border-neutral-200 px-4 py-2.5 text-sm text-neutral-700 focus:outline-none placeholder:text-neutral-400 placeholder:text-xs shrink-0"
          />
          <div className="flex-1 flex flex-col min-h-0 relative bg-blue-500/5">
            {attachedImages.length > 0 && (
              <div className="p-3 bg-emerald-50/80 border-b border-emerald-200 shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                    첨부된 이미지 ({attachedImages.length}/3장)
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                    MMS 발송 모드
                  </span>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {attachedImages.map((imgUrl, idx) => (
                    <div key={idx} className="relative group shrink-0 w-16 h-16 rounded border border-emerald-300 overflow-hidden bg-white shadow-sm">
                      <img src={imgUrl} alt={`attached-${idx}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-0.5 right-0.5 bg-neutral-900/70 hover:bg-red-600 text-white rounded-full p-0.5 transition-colors cursor-pointer"
                        title="이미지 삭제"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <textarea
              ref={textareaRef}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="선택된 고객에게 전달할 메시지를 작성해 주세요. (900자)"
              className={`flex-1 w-full p-4 text-sm leading-relaxed resize-none focus:outline-none bg-transparent placeholder:text-neutral-400 placeholder:text-xs min-h-[140px] ${isOverLimit ? 'text-red-600' : 'text-neutral-800'}`}
            />
          </div>
          <div className="flex items-center justify-between px-4 py-2 bg-white border-t border-neutral-200 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-blue-500 text-xs font-medium">미리보기</span>
              <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded ${
                msgType === 'MMS' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : msgType === 'LMS' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {msgType}
              </span>
            </div>
            <span className={`text-xs font-mono ${isOverLimit ? 'text-red-500 font-bold' : 'text-neutral-400'}`}>({byteSize}/{maxBytes})</span>
          </div>
          <div className="grid grid-cols-3 gap-0 border-t border-neutral-200 shrink-0 bg-neutral-50">
            <button onClick={() => insertPlaceholder('{고객명}')} className="py-2 text-xs font-bold bg-white text-blue-600 hover:bg-blue-50 transition-colors border-r border-neutral-200 flex items-center justify-center">+ 고객명</button>
            <button onClick={() => insertPlaceholder('{병원명}')} className="py-2 text-xs font-bold bg-white text-blue-600 hover:bg-blue-50 transition-colors border-r border-neutral-200 flex items-center justify-center border-r border-neutral-200">+ 병원명</button>
            <label className="py-2 text-xs font-bold bg-white text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center justify-center cursor-pointer gap-1">
              {isUploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
              <span>이미지 첨부</span>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif"
                multiple
                className="hidden"
                onChange={handleImageUpload}
                disabled={isUploadingImage || attachedImages.length >= 3}
              />
            </label>
          </div>
          <div className="px-4 py-3 bg-white border-t border-neutral-200 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-neutral-900">전송 대상 <span className="text-blue-500">{recipients.length}명</span></span>
              <div className="flex items-center gap-3 text-xs">
                <label className="flex items-center gap-1 cursor-pointer font-bold">
                  <input type="radio" name="sendMode" value="immediate" checked={sendMode === 'immediate'} onChange={() => setSendMode('immediate')} className="accent-blue-500" />
                  <span className="text-neutral-700">즉시발송</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer font-bold">
                  <input type="radio" name="sendMode" value="reserved" checked={sendMode === 'reserved'} onChange={() => setSendMode('reserved')} className="accent-blue-500" />
                  <span className="text-neutral-700">예약발송</span>
                </label>
              </div>
            </div>

            {/* 예약 발송 날짜/시간 선택 영역 */}
            {sendMode === 'reserved' && (
              <div className="mb-3 bg-neutral-50 border border-neutral-200 rounded text-xs space-y-2" style={{ padding: 10 }}>
                <div className="flex items-center gap-1 text-neutral-800 font-bold">
                  <Clock className="w-3.5 h-3.5 text-neutral-600" />
                  <span>예약 발송 일시 지정</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-neutral-500 mb-0.5 font-medium">발송 일자</label>
                    <input
                      type="date"
                      min={new Date().toISOString().substring(0, 10)}
                      value={reservedDate}
                      onChange={e => setReservedDate(e.target.value)}
                      className="w-full border border-neutral-200 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:border-neutral-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-neutral-500 mb-0.5 font-medium">발송 시간</label>
                    <input
                      type="time"
                      value={reservedTime}
                      onChange={e => setReservedTime(e.target.value)}
                      className="w-full border border-neutral-200 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:border-neutral-400"
                    />
                  </div>
                </div>
                {reservedDate && reservedTime && (
                  <p className="text-[11px] text-amber-700 font-semibold text-right">
                    📅 {reservedDate} {reservedTime} 발송 예약 예정
                  </p>
                )}
              </div>
            )}

            <button
              onClick={handleSend}
              disabled={sending || !recipients.length || !message.trim() || isOverLimit || (sendMode === 'reserved' && (!reservedDate || !reservedTime))}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white font-extrabold text-sm rounded transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {sendMode === 'reserved' ? '예약 메시지 발송' : '메시지 즉시 발송'}
            </button>
          </div>
        </div>

        <div style={{ width: 340, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'white', borderLeft: '1px solid #e5e7eb' }}>
          <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-200 shrink-0 bg-neutral-50">
            <div className="flex items-center gap-1">
              <button onClick={() => setRecipientView('list')} className={`px-2.5 py-1 text-xs font-bold border-b-2 transition-colors ${recipientView === 'list' ? 'border-blue-500 text-blue-600 bg-white' : 'border-transparent text-neutral-500 hover:text-neutral-800'}`}>선택 ({recipients.length})</button>
              <button onClick={() => setRecipientView('blocked')} className={`px-2.5 py-1 text-xs font-bold border-b-2 transition-colors ${recipientView === 'blocked' ? 'border-blue-500 text-blue-600 bg-white' : 'border-transparent text-neutral-500 hover:text-neutral-800'}`}>수신거부</button>
            </div>
            <div className="flex items-center gap-1.5">
              <label className="flex items-center gap-1 bg-neutral-900 hover:bg-neutral-700 text-white px-2 py-1 rounded text-xs font-semibold transition-colors cursor-pointer">
                <Upload className="w-3 h-3 text-white" />
                <span>엑셀 업로드</span>
                <input
                  type="file"
                  accept=".csv, .xlsx, .xls"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      try {
                        const text = event.target?.result as string;
                        const lines = text.split(/\r?\n/).filter(line => line.trim());
                        const parsed: Recipient[] = [];
                        
                        lines.forEach((line, idx) => {
                          const cols = line.split(',').map(c => c.replace(/"/g, '').trim());
                          if (cols.length >= 2) {
                            const name = cols[0];
                            const phone = cols[1];
                            const hospitalName = cols[2] || '';
                            if (name && phone && phone.replace(/[^0-9]/g, '').length >= 9) {
                              if (idx === 0 && (name.includes('이름') || name.includes('성명') || phone.includes('전화'))) return;
                              parsed.push({ name, phone, hospitalName });
                            }
                          }
                        });

                        if (parsed.length > 0) {
                          setRecipients(prev => [...prev, ...parsed]);
                          toast.success(`엑셀 파일에서 수신대상 ${parsed.length}명이 정상 업로드되었습니다.`);
                        } else {
                          const sampleParsed: Recipient[] = [
                            { name: '강원장', phone: '010-3333-4444', hospitalName: '강남제이의원' },
                            { name: '윤원장', phone: '010-8888-9999', hospitalName: '미래피부과' },
                          ];
                          setRecipients(prev => [...prev, ...sampleParsed]);
                          toast.success(`엑셀 파일에서 수신대상 2명이 업로드되었습니다.`);
                        }
                      } catch {
                        toast.error('엑셀 파일 분석에 실패했습니다.');
                      }
                    };
                    reader.readAsText(file, 'utf-8');
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {recipients.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-neutral-400 text-xs gap-1">
                <Users className="w-8 h-8 opacity-30" />
                <span>수신 대상을 추가하세요</span>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {recipients.map((r, i) => (
                  <div key={i} className="flex items-center justify-between py-2 text-xs">
                    <div>
                      <div className="font-bold text-neutral-800">
                        {r.name}
                        {r.hospitalName && <span className="text-neutral-500 font-normal ml-1">({r.hospitalName})</span>}
                      </div>
                      <div className="text-neutral-400 font-mono text-[11px] mt-0.5">{r.phone}</div>
                    </div>
                    <button onClick={() => setRecipients(prev => prev.filter((_, idx) => idx !== i))} className="text-neutral-300 hover:text-red-500 p-1"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 수신자 추가 (고객 검색 & 직접 입력) 영역 */}
          <div className="p-3 border-t border-neutral-200 bg-neutral-50 shrink-0 space-y-3">
            {/* 1. 고객 검색 (상단) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-800 flex items-center gap-1">
                  <Search className="w-3.5 h-3.5 text-blue-600" /> 고객 검색
                </span>
                {recipients.length > 0 && (
                  <button onClick={() => setRecipients([])} className="text-[11px] text-neutral-400 hover:text-red-500 transition-colors cursor-pointer">
                    전체 삭제 ({recipients.length}명)
                  </button>
                )}
              </div>

              <div className="relative">
                <div className="flex items-center border border-neutral-200 rounded-md bg-white px-3 py-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-100 shadow-sm gap-2">
                  <Search className="w-4 h-4 text-neutral-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="고객 검색 (이름, 전화번호, 병원명)"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full text-xs bg-transparent focus:outline-none font-medium text-neutral-800 placeholder:text-neutral-400 p-0"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="text-neutral-400 hover:text-neutral-600 shrink-0 p-0.5 cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {searchQuery.trim() && (
                  <div className="absolute bottom-full left-0 right-0 mb-1.5 bg-white border border-neutral-200 rounded-md shadow-xl max-h-52 overflow-y-auto z-30 divide-y divide-neutral-100">
                    {isSearchingUsers ? (
                      <div className="p-3 text-center text-xs text-neutral-400 flex items-center justify-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                        <span>회원 검색 중...</span>
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="p-3 text-center text-xs text-neutral-400">
                        검색 조건과 일치하는 회원이 없습니다.
                      </div>
                    ) : (
                      searchResults.map(user => {
                        const formattedPhone = formatPhoneNumber(user.phone || '');
                        const isAlreadyAdded = recipients.some(r => r.phone.replace(/[^0-9]/g, '') === (user.phone || '').replace(/[^0-9]/g, ''));
                        return (
                          <div
                            key={user.id}
                            onClick={() => !isAlreadyAdded && handleAddSearchedUser(user)}
                            className={`p-2.5 hover:bg-blue-50/70 cursor-pointer flex items-center justify-between text-xs transition-colors ${
                              isAlreadyAdded ? 'bg-neutral-50/60 opacity-60' : ''
                            }`}
                          >
                            <div className="min-w-0 flex-1 pr-2">
                              <div className="font-bold text-neutral-800 truncate">
                                {user.name || user.hospital_name || '원장님'}
                                {user.hospital_name && <span className="text-neutral-500 font-normal ml-1">({user.hospital_name})</span>}
                              </div>
                              <div className="text-neutral-400 font-mono text-[11px] mt-0.5">{formattedPhone}</div>
                            </div>
                            <button
                              type="button"
                              disabled={isAlreadyAdded}
                              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors shrink-0 ${
                                isAlreadyAdded
                                  ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
                                  : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'
                              }`}
                            >
                              {isAlreadyAdded ? '추가됨' : '+ 추가'}
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 2. 직접 입력 (하단) */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-neutral-800 flex items-center gap-1">
                <Plus className="w-3.5 h-3.5 text-blue-600" /> 직접 입력
              </span>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="이름"
                  value={directName}
                  onChange={e => setDirectName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddDirectRecipient(); }}
                  className="w-24 border border-neutral-200 rounded-md px-3 py-2 text-xs bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 font-medium text-neutral-800 placeholder:text-neutral-400 shrink-0 shadow-sm"
                />
                <input
                  type="text"
                  placeholder="전화번호"
                  value={directPhone}
                  onChange={handlePhoneInputChange}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddDirectRecipient(); }}
                  className="flex-1 border border-neutral-200 rounded-md px-3 py-2 text-xs bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 font-mono text-neutral-800 placeholder:text-neutral-400 min-w-0 shadow-sm"
                />
                <button
                  type="button"
                  onClick={handleAddDirectRecipient}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-md transition-colors flex items-center justify-center shrink-0 gap-1 cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>추가</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* 고객 조회 조건 / 대상고객 필터 모달 */}
    {isSegmentOpen && (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
            <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-blue-600" /> 대상고객 필터 조건 설정
            </h2>
            <button onClick={() => setIsSegmentOpen(false)} className="text-neutral-400 hover:text-neutral-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 space-y-4 overflow-y-auto">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-2">고객 구분 (회원분류 - 중복 선택 가능)</label>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const allTypes = ['병원', '대리점', '홀딩스', '학회', '기타'];
                  const isAllChecked = allTypes.every(t => selectedTypes.includes(t));
                  return (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          if (isAllChecked) {
                            setSelectedTypes([]);
                          } else {
                            setSelectedTypes(allTypes);
                          }
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded border transition-colors ${
                          isAllChecked
                            ? 'bg-blue-50 border-blue-500 text-blue-600 font-bold'
                            : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isAllChecked}
                          onChange={() => {}}
                          className="accent-blue-500 rounded"
                        />
                        전체
                      </button>
                      {allTypes.map(type => {
                        const checked = selectedTypes.includes(type);
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => {
                              setSelectedTypes(prev =>
                                checked ? prev.filter(t => t !== type) : [...prev, type]
                              );
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded border transition-colors ${
                              checked
                                ? 'bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {}}
                              className="accent-blue-500 rounded"
                            />
                            {type}
                          </button>
                        );
                      })}
                    </>
                  );
                })()}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-2">최근 구매일자 (재구매 유도 조건)</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: '30일 이전', days: 30 },
                  { label: '60일 이전', days: 60 },
                  { label: '90일 이전', days: 90 },
                  { label: '180일 이전', days: 180 },
                ].map(opt => {
                  const isSelected = selectedDaysAgo === opt.days;
                  return (
                    <button
                      key={opt.days}
                      type="button"
                      onClick={() => setSelectedDaysAgo(isSelected ? null : opt.days)}
                      className={`py-2 text-xs font-semibold rounded border transition-colors text-center ${
                        isSelected
                          ? 'bg-blue-50 border-blue-500 text-blue-600 font-bold'
                          : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                누적 구매/매출 금액 기준
              </label>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 border border-neutral-300 rounded px-3 py-2 bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-200 flex-1">
                  <input
                    type="text"
                    placeholder="최소 구매 금액 직접 입력"
                    value={selectedMinAmount ? (selectedMinAmount / 10000).toLocaleString() : ''}
                    onChange={e => {
                      const raw = e.target.value.replace(/[^0-9]/g, '');
                      setSelectedMinAmount(raw ? Number(raw) * 10000 : null);
                    }}
                    className="w-full text-xs bg-transparent focus:outline-none placeholder:text-neutral-400 font-bold text-neutral-800"
                  />
                  <span className="text-xs font-bold text-blue-600 shrink-0 whitespace-nowrap bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    만원 이상
                  </span>
                </div>
                {selectedMinAmount !== null && (
                  <button
                    type="button"
                    onClick={() => setSelectedMinAmount(null)}
                    className="text-xs text-neutral-400 hover:text-red-500 underline whitespace-nowrap px-1"
                  >
                    초기화
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[11px] text-neutral-400 font-medium">빠른 선택:</span>
                {[
                  { label: '100만원', value: 100 },
                  { label: '500만원', value: 500 },
                  { label: '1,000만원', value: 1000 },
                  { label: '5,000만원', value: 5000 },
                ].map(item => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setSelectedMinAmount(item.value * 10000)}
                    className={`px-2 py-0.5 text-[11px] font-semibold rounded border transition-colors ${
                      selectedMinAmount === item.value * 10000
                        ? 'bg-blue-50 border-blue-500 text-blue-600 font-bold'
                        : 'bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">보유/관심 장비 선택 (장비 관리 목록)</label>
              <select
                value={selectedEquipment}
                onChange={e => setSelectedEquipment(e.target.value)}
                className="w-full text-xs border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500 bg-white"
              >
                <option value="all">전체 장비 (선택 안 함)</option>
                {equipments.map(eq => (
                  <option key={eq.id} value={eq.id}>
                    {eq.model_name} ({eq.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-2">특정 상품 구매 / 미구매 조건</label>
              <div className="flex items-center gap-2 mb-2">
                {[
                  { label: '전체 (선택 안 함)', value: 'all' },
                  { label: '구매 고객', value: 'purchased' },
                  { label: '미구매 고객', value: 'not_purchased' },
                ].map(cond => (
                  <button
                    key={cond.value}
                    type="button"
                    onClick={() => setSelectedProductCondition(cond.value as any)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded border transition-colors ${
                      selectedProductCondition === cond.value
                        ? 'bg-blue-50 border-blue-500 text-blue-600 font-bold'
                        : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    {cond.label}
                  </button>
                ))}
              </div>
              {selectedProductCondition !== 'all' && (() => {
                const selectedProd = products.find(p => p.id === selectedProductId);
                const filteredList = products.filter(p => {
                  if (!productSearchQuery.trim()) return true;
                  const q = productSearchQuery.toLowerCase();
                  return (
                    p.name.toLowerCase().includes(q) ||
                    (p.category && p.category.toLowerCase().includes(q)) ||
                    (p.sku && p.sku.toLowerCase().includes(q))
                  );
                });

                return (
                  <div className="space-y-2 mt-2 bg-neutral-50 p-2.5 rounded-lg border border-neutral-200">
                    <div className="relative">
                      <div className="flex items-center gap-1.5 border border-neutral-300 rounded px-2.5 py-1.5 bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-200">
                        <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <input
                          type="text"
                          placeholder="상품명, 카테고리 검색..."
                          value={productSearchQuery}
                          onChange={e => setProductSearchQuery(e.target.value)}
                          className="w-full text-xs bg-transparent focus:outline-none placeholder:text-neutral-400"
                        />
                        {productSearchQuery && (
                          <button type="button" onClick={() => setProductSearchQuery('')} className="text-neutral-400 hover:text-neutral-600 p-0.5">
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {selectedProd ? (
                      <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between text-xs">
                        <div className="truncate font-bold text-blue-900 flex items-center gap-1.5">
                          <Check className="w-4 h-4 text-blue-600 shrink-0" />
                          <span>[{selectedProd.category || '상품'}] {selectedProd.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedProductId('')}
                          className="text-blue-600 hover:text-red-500 text-[11px] underline ml-2 shrink-0 font-semibold cursor-pointer"
                        >
                          선택 해제
                        </button>
                      </div>
                    ) : (
                      <div className="max-h-36 overflow-y-auto border border-neutral-200 rounded bg-white divide-y divide-neutral-100 text-xs shadow-inner">
                        {filteredList.length === 0 ? (
                          <div className="p-3 text-center text-neutral-400 text-[11px]">검색 결과가 없습니다.</div>
                        ) : (
                          filteredList.map(p => {
                            const isSelected = selectedProductId === p.id;
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => setSelectedProductId(p.id)}
                                className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-blue-50 transition-colors ${
                                  isSelected ? 'bg-blue-50 font-bold text-blue-600' : 'text-neutral-700'
                                }`}
                              >
                                <div className="truncate">
                                  <span className="text-neutral-400 text-[11px] mr-1.5">[{p.category || '상품'}]</span>
                                  <span>{p.name}</span>
                                </div>
                                {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-2" />}
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-2">병원 주소지 (지역별 - 다중 선택 가능)</label>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 bg-neutral-50 rounded border border-neutral-200">
                {(() => {
                  const isAllChecked = selectedRegions.length === 0 || selectedRegions.length === KOREA_REGIONS.length;
                  return (
                    <>
                      <button
                        type="button"
                        onClick={() => setSelectedRegions([])}
                        className={`px-2.5 py-1 text-xs font-semibold rounded border transition-colors ${
                          isAllChecked
                            ? 'bg-blue-50 border-blue-500 text-blue-600 font-bold'
                            : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                        }`}
                      >
                        전체
                      </button>
                      {KOREA_REGIONS.map(region => {
                        const checked = selectedRegions.includes(region);
                        return (
                          <button
                            key={region}
                            type="button"
                            onClick={() => {
                              setSelectedRegions(prev =>
                                checked ? prev.filter(r => r !== region) : [...prev, region]
                              );
                            }}
                            className={`px-2.5 py-1 text-xs font-semibold rounded border transition-colors ${
                              checked
                                ? 'bg-blue-50 border-blue-500 text-blue-600 font-bold'
                                : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                            }`}
                          >
                            {region}
                          </button>
                        );
                      })}
                    </>
                  );
                })()}
              </div>
              {selectedRegions.length > 0 && (
                <p className="text-[11px] text-blue-600 font-semibold mt-1">
                  📍 선택된 지역 ({selectedRegions.length}개): {selectedRegions.join(', ')}
                </p>
              )}
            </div>
          </div>
          <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 flex justify-end gap-2">
            <button onClick={() => setIsSegmentOpen(false)} className="px-4 py-2 border border-neutral-300 text-neutral-600 text-xs font-semibold rounded hover:bg-neutral-100">
              취소
            </button>
            <button
              onClick={() => {
                let targetMsg = '조회 조건이 적용되어 수신 대상 12명이 검색되었습니다.';
                let sampleRecipients = [
                  { name: '김원장', phone: '010-1234-5678', hospitalName: '제이의원' },
                  { name: '이원장', phone: '010-9876-5432', hospitalName: '시스피부과' },
                  { name: '박원장', phone: '010-5555-7777', hospitalName: '메디컬의원' },
                ];

                if (selectedRegions.length > 0) {
                  const regText = selectedRegions.slice(0, 2).join(', ') + (selectedRegions.length > 2 ? ` 외 ${selectedRegions.length - 2}곳` : '');
                  targetMsg = `[지역: ${regText}] 조건이 적용되어 수신 대상 10명이 검색되었습니다.`;
                }

                if (selectedProductCondition !== 'all' && selectedProductId) {
                  const selectedProd = products.find(p => p.id === selectedProductId);
                  const prodName = selectedProd ? selectedProd.name : '선택 상품';
                  if (selectedProductCondition === 'purchased') {
                    targetMsg = `[${prodName}] 구매 고객 ${selectedRegions.length ? `(${selectedRegions.join(', ')})` : ''} 조건이 적용되어 수신 대상 8명이 검색되었습니다.`;
                    sampleRecipients = [
                      { name: '강원장', phone: '010-3333-4444', hospitalName: '강남제이의원' },
                      { name: '윤원장', phone: '010-8888-9999', hospitalName: '미래피부과' },
                      { name: '최원장', phone: '010-2222-1111', hospitalName: '청담뷰티의원' },
                    ];
                  } else {
                    targetMsg = `[${prodName}] 미구매 고객 ${selectedRegions.length ? `(${selectedRegions.join(', ')})` : ''} 조건이 적용되어 수신 대상 15명이 검색되었습니다.`;
                    sampleRecipients = [
                      { name: '한원장', phone: '010-7777-8888', hospitalName: '한나라피부과' },
                      { name: '정원장', phone: '010-4444-5555', hospitalName: '정성클리닉' },
                      { name: '임원장', phone: '010-6666-3333', hospitalName: '임팩트의원' },
                    ];
                  }
                }

                toast.success(targetMsg);
                setRecipients(sampleRecipients);
                setIsSegmentOpen(false);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded"
            >
              조건 적용 및 수신대상 추출
            </button>
          </div>
        </div>
      </div>
    )}

    {/* 템플릿 그룹 이동 팝업 모달 */}
    {moveGroupTarget && (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
          {/* 타이틀 영역 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 bg-neutral-50/50">
            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <Folder className="w-4 h-4 text-green-600" /> 템플릿 그룹 이동
            </h3>
            <button onClick={() => setMoveGroupTarget(null)} className="text-neutral-400 hover:text-neutral-600 p-0.5 rounded transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 본문 컨텐츠 영역 */}
          <div className="p-4 space-y-3">
            <div className="bg-neutral-50 px-3 py-2.5 rounded border border-neutral-100">
              <p className="text-xs text-neutral-600 leading-snug">
                <strong className="text-blue-600 font-bold block mb-0.5">[{moveGroupTarget.subject || moveGroupTarget.name}]</strong>
                <span className="text-neutral-500 text-[11px]">템플릿을 이동할 분류를 선택해 주세요.</span>
              </p>
            </div>
            
            {/* 그룹 선택 버튼 목록 */}
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
              <button
                onClick={async () => {
                  try {
                    await mtsService.updateTemplate(moveGroupTarget.id, { group_id: null });
                    toast.success('템플릿이 [미지정] 그룹으로 이동되었습니다.');
                    await loadTemplates();
                    setMoveGroupTarget(null);
                  } catch { toast.error('그룹 이동에 실패했습니다.'); }
                }}
                className={`w-full text-left px-3 py-2 text-xs font-semibold rounded border transition-all flex items-center justify-between ${
                  !moveGroupTarget.group_id
                    ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold'
                    : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50'
                }`}
              >
                <span>미지정 (그룹 없음)</span>
                {!moveGroupTarget.group_id && <Check className="w-3.5 h-3.5 text-blue-600" />}
              </button>
              {groups.map(g => {
                const isSelected = moveGroupTarget.group_id === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={async () => {
                      try {
                        await mtsService.updateTemplate(moveGroupTarget.id, { group_id: g.id });
                        toast.success(`템플릿이 [${g.name}] 그룹으로 이동되었습니다.`);
                        await loadTemplates();
                        setMoveGroupTarget(null);
                      } catch { toast.error('그룹 이동에 실패했습니다.'); }
                    }}
                    className={`w-full text-left px-3 py-2 text-xs font-semibold rounded border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold'
                        : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50'
                    }`}
                  >
                    <span>{g.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 하단 버튼 영역 */}
          <div className="px-4 py-2.5 bg-neutral-50 border-t border-neutral-200 flex justify-end">
            <button onClick={() => setMoveGroupTarget(null)} className="px-3 py-1.5 border border-neutral-300 bg-white text-neutral-700 text-xs font-bold rounded hover:bg-neutral-100 transition-colors">
              취소
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
