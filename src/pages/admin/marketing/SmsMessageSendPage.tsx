import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Send, Plus, Trash2, Edit2, Check, X, ChevronRight, Users, Upload, Smartphone, AlertCircle, Clock, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { mtsService, DEFAULT_FROM_PHONE, type SmsTemplateGroup, type SmsTemplate } from '../../../services/mtsService';
import { adminService } from '../../../services/adminService';
import { toast } from 'sonner';
import { useModal } from '../../../context/ModalContext';

// ── 타입 ──────────────────────────────────────────────────
// ── 타입 ──────────────────────────────────────────────────
interface Recipient { 
  name: string; 
  phone: string; 
  hospitalName?: string;
  points?: number;
}

// ── 컴포넌트 ──────────────────────────────────────────────
export function SmsMessageSendPage() {
  const navigate = useNavigate();
  const { confirm } = useModal();

  // 템플릿
  const [groups, setGroups] = useState<SmsTemplateGroup[]>([]);
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<SmsTemplateGroup | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<SmsTemplate | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [isAddingGroup, setIsAddingGroup] = useState(false);

  // 에디터
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [prefixWord, setPrefixWord] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 수신 대상
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [directName, setDirectName] = useState('');
  const [directPhone, setDirectPhone] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [memberResults, setMemberResults] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 발송 옵션
  const [storeId] = useState('70000');
  const [fromPhone] = useState(DEFAULT_FROM_PHONE);
  const [sendMode, setSendMode] = useState<'immediate' | 'reserved'>('immediate');
  const [reservedDate, setReservedDate] = useState('');
  const [reservedTime, setReservedTime] = useState('');
  const [sending, setSending] = useState(false);
  const [credit, setCredit] = useState<number | null>(null);

  // URL 첨부
  const [urlList, setUrlList] = useState<string[]>([]);
  const [newUrl, setNewUrl] = useState('');

  // 파생 계산
  const msgType = mtsService.getMessageType(message, subject);
  const byteSize = mtsService.getByteSize(message);
  const maxBytes = mtsService.getMaxBytes(msgType === 'MMS' ? 'LMS' : msgType);
  const isOverLimit = byteSize > maxBytes;
  const filteredTemplates = selectedGroup
    ? templates.filter(t => t.group_id === selectedGroup.id)
    : templates;

  // ── 데이터 로드 ───────────────────────────────────────────
  useEffect(() => {
    loadGroups();
    loadTemplates();
    loadCredit();
  }, []);

  const loadGroups = async () => {
    try { setGroups(await mtsService.getTemplateGroups()); } catch { }
  };
  const loadTemplates = async () => {
    try { setTemplates(await mtsService.getTemplates()); } catch { }
  };
  const loadCredit = async () => {
    try {
      const data = await mtsService.getSmsCredit(storeId);
      setCredit(data.leftLmsAmount);
    } catch { }
  };

  // ── 템플릿 그룹 CRUD ─────────────────────────────────────
  const handleAddGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      await mtsService.createTemplateGroup(newGroupName.trim(), groups.length);
      await loadGroups();
      setNewGroupName(''); setIsAddingGroup(false);
      toast.success('그룹이 추가되었습니다.');
    } catch { toast.error('그룹 추가에 실패했습니다.'); }
  };

  const handleUpdateGroup = async (id: string) => {
    if (!editingGroupName.trim()) return;
    try {
      await mtsService.updateTemplateGroup(id, editingGroupName.trim());
      await loadGroups();
      setEditingGroupId(null);
      toast.success('그룹명이 수정되었습니다.');
    } catch { toast.error('그룹 수정에 실패했습니다.'); }
  };

  const handleDeleteGroup = async (id: string) => {
    try {
      await mtsService.deleteTemplateGroup(id);
      await loadGroups();
      if (selectedGroup?.id === id) setSelectedGroup(null);
      toast.success('그룹이 삭제되었습니다.');
    } catch { toast.error('그룹 삭제에 실패했습니다.'); }
  };

  // ── 템플릿 적용 ───────────────────────────────────────────
  const applyTemplate = (t: SmsTemplate) => {
    setSelectedTemplate(t);
    setSubject(t.subject || '');
    setMessage(t.message);
    setPrefixWord(t.prefix_word || '');
  };

  const insertPlaceholder = (placeholder: string) => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = message;
    const newText = text.substring(0, start) + placeholder + text.substring(end);
    setMessage(newText);
    
    // 포커스 유지 및 커서 이동
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newPos = start + placeholder.length;
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  // ── 템플릿 저장 ───────────────────────────────────────────
  const handleSaveTemplate = async () => {
    if (!message.trim()) { toast.error('메시지 내용을 입력하세요.'); return; }
    const name = prompt('템플릿 이름을 입력하세요:');
    if (!name) return;
    try {
      if (selectedTemplate?.id) {
        await mtsService.updateTemplate(selectedTemplate.id, { name, subject: subject || null, message, prefix_word: prefixWord || null, group_id: selectedGroup?.id || null });
        toast.success('템플릿이 수정되었습니다.');
      } else {
        await mtsService.createTemplate({ name, subject: subject || null, message, prefix_word: prefixWord || null, group_id: selectedGroup?.id || null });
        toast.success('템플릿이 저장되었습니다.');
      }
      await loadTemplates();
    } catch { toast.error('템플릿 저장에 실패했습니다.'); }
  };

  // ── 수신 대상 ─────────────────────────────────────────────
  const addDirectRecipient = () => {
    if (!directPhone.trim()) { toast.error('전화번호를 입력하세요.'); return; }
    const phone = directPhone.replace(/\D/g, '');
    if (recipients.find(r => r.phone === phone)) { toast.error('이미 추가된 번호입니다.'); return; }
    setRecipients(prev => [...prev, { name: directName || '직접입력', phone }]);
    setDirectName(''); setDirectPhone('');
  };

  const searchMembers = async (term: string) => {
    setSearchTerm(term);
    if (term.length < 2) { setMemberResults([]); return; }
    setLoadingMembers(true);
    try {
      const all = await adminService.getUsers();
      const filtered = all.filter((m: any) =>
        m.name?.includes(term) || m.hospitalName?.includes(term) || m.userId?.includes(term)
      ).slice(0, 10);
      setMemberResults(filtered);
    } catch { } finally { setLoadingMembers(false); }
  };

  const addMemberRecipient = (member: any) => {
    const phone = (member.phone || '').replace(/\D/g, '');
    if (!phone) { toast.error('해당 회원의 전화번호가 없습니다.'); return; }
    if (recipients.find(r => r.phone === phone)) { toast.error('이미 추가된 번호입니다.'); return; }
    setRecipients(prev => [...prev, { name: member.name || member.hospitalName, phone }]);
    setSearchTerm(''); setMemberResults([]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop()?.toLowerCase();
    
    if (fileExt === 'csv') {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        const lines = text.split('\n').filter(Boolean).slice(1);
        const newRecips: Recipient[] = [];
        lines.forEach(line => {
          const [name, phone, hospital, points] = line.split(',').map(s => s?.trim());
          if (phone) {
            const cleanPhone = phone.replace(/\D/g, '');
            if (cleanPhone && !recipients.find(r => r.phone === cleanPhone)) {
              newRecips.push({ 
                name: name || hospital || '회원', 
                phone: cleanPhone,
                hospitalName: hospital || undefined,
                points: points ? parseInt(points) : undefined
              });
            }
          }
        });
        setRecipients(prev => [...prev, ...newRecips]);
        toast.success(`${newRecips.length}명이 추가되었습니다.`);
      };
      reader.readAsText(file);
    } else if (fileExt === 'xlsx' || fileExt === 'xls') {
      try {
        // @ts-ignore
        const XLSX = await import(/* @vite-ignore */ 'xlsx');
        const reader = new FileReader();
        reader.onload = (ev) => {
          const data = new Uint8Array(ev.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[];
          
          const newRecips: Recipient[] = [];
          jsonData.slice(1).forEach((row: any[]) => {
            const name = String(row[0] || '').trim();
            const phone = String(row[1] || '').trim();
            const hospital = String(row[2] || '').trim();
            const points = row[3];

            if (phone) {
              const cleanPhone = phone.replace(/\D/g, '');
              if (cleanPhone && !recipients.find(r => r.phone === cleanPhone)) {
                newRecips.push({ 
                  name: name || hospital || '회원', 
                  phone: cleanPhone,
                  hospitalName: hospital || undefined,
                  points: points ? Number(points) : undefined
                });
              }
            }
          });
          setRecipients(prev => [...prev, ...newRecips]);
          toast.success(`${newRecips.length}명이 추가되었습니다.`);
        };
        reader.readAsArrayBuffer(file);
      } catch (err) {
        toast.error('Excel 라이브러리(xlsx)가 설치되어 있지 않습니다. npm install xlsx를 수행해주세요.');
      }
    } else {
      toast.error('지원하지 않는 파일 형식입니다. (.csv, .xlsx)');
    }
    
    e.target.value = '';
  };

  // ── 발송 ────────────────────────────────────────────────
  const handleSend = async () => {
    if (!message.trim()) { toast.error('메시지 내용을 입력하세요.'); return; }
    if (recipients.length === 0) { toast.error('수신 대상을 1명 이상 추가하세요.'); return; }
    if (isOverLimit) { toast.error('메시지 바이트 한도를 초과했습니다.'); return; }

    let reservedAt: string | undefined;
    if (sendMode === 'reserved') {
      if (!reservedDate || !reservedTime) { toast.error('예약 발송 일시를 선택하세요.'); return; }
      reservedAt = new Date(`${reservedDate}T${reservedTime}`).toISOString();
    }

    let finalMessage = (prefixWord ? prefixWord : '') + message;
    if (urlList.length > 0) finalMessage += '\n' + urlList.join('\n');
    if (prefixWord === '(광고)') finalMessage += '\n\n무료수신거부 080-123-4567';
    
    /* 
    if (credit !== null && recipients.length > credit) {
      toast.error(`보유 크레딧(${credit.toLocaleString()}개)이 부족합니다. (${recipients.length}명 선택됨)`);
      return;
    }
    */

    const confirmed = await confirm({
      title: '문자 발송 확인',
      description: `${recipients.length}명에게 ${msgType} 문자를 ${sendMode === 'reserved' ? '예약' : '즉시'} 발송하시겠습니까?`,
      confirmText: '발송하기',
      cancelText: '취소'
    });
    if (!confirmed) return;

    setSending(true);
    try {
      const { edgeFnCalled } = await mtsService.sendBulkSms({
        fromPhone,
        subject: subject || undefined,
        message: finalMessage,
        prefixWord: prefixWord || undefined,
        purpose: 'mkt',
        reservedAt,
        recipients,
        attachedUrls: urlList.length > 0 ? urlList : undefined,
        storeId,
      });
      if (edgeFnCalled) {
        toast.success(`${recipients.length}명에게 발송이 완료되었습니다.`);
      } else {
        toast.success(`${recipients.length}명 발송이 접수되었습니다. (MTS 연동 후 실 발송됩니다)`);
      }
      setMessage(''); setSubject(''); setPrefixWord(''); setRecipients([]); setUrlList([]);
      loadCredit(); // 발송 후 잔액 갱신
      navigate('/admin/marketing/sms/history');
    } catch (e: any) {
      toast.error('발송에 실패했습니다. 잠시 후 다시 시도하세요.');
    } finally {
      setSending(false);
    }
  };

  const getPreviewMessage = () => {
    let preview = message;
    const sample = {
      name: '홍길동',
      hospital: '제이시스병원',
      points: 12500
    };
    preview = preview.replace(/%이름%/g, sample.name);
    preview = preview.replace(/%병원명%/g, sample.hospital);
    preview = preview.replace(/%포인트%/g, sample.points.toLocaleString());
    
    if (urlList.length > 0) {
      preview += '\n' + urlList.join('\n');
    }
    
    if (prefixWord === '(광고)') {
      preview += '\n\n무료수신거부 080-123-4567';
    }
    
    return preview;
  };

  // ── 렌더링 ───────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">메시지 전송</h2>
          <p className="text-sm text-neutral-500 mt-0.5">SMS/LMS 마케팅 문자를 작성하고 회원에게 발송합니다.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <Smartphone className="w-4 h-4" />
          <span>발신번호: {fromPhone}</span>
        </div>
      </div>

      {/* ── 상단: 템플릿 갤러리 (Smartphone 카드 스타일) ── */}
      <div className="border border-neutral-200 bg-white p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-tight">메시지 템플릿 갤러리</h3>
            <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg">
              <button
                onClick={() => setSelectedGroup(null)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${!selectedGroup ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'}`}
              >
                전체
              </button>
              {groups.map(g => (
                <div key={g.id} className="group relative flex items-center">
                  <button
                    onClick={() => setSelectedGroup(g)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${selectedGroup?.id === g.id ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'}`}
                  >
                    {editingGroupId === g.id ? (
                      <input
                        autoFocus
                        value={editingGroupName}
                        onChange={e => setEditingGroupName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleUpdateGroup(g.id)}
                        className="w-16 bg-transparent outline-none border-b border-neutral-900"
                      />
                    ) : g.name}
                  </button>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white border border-neutral-200 p-1 shadow-lg rounded opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button onClick={() => { setEditingGroupId(g.id); setEditingGroupName(g.name); }} className="text-neutral-400 hover:text-neutral-900"><Edit2 className="w-3 h-3" /></button>
                    <button onClick={() => handleDeleteGroup(g.id)} className="p-1 text-neutral-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
              ))}
              <button onClick={() => setIsAddingGroup(true)} className="p-1.5 text-neutral-400 hover:text-neutral-900">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          <button onClick={handleSaveTemplate} className="text-xs font-bold text-[#21358D] hover:underline flex items-center gap-1">
            <Plus className="w-3 h-3" /> 새 템플릿 보관하기
          </button>
        </div>

        {isAddingGroup && (
          <div className="flex gap-2 mb-6 max-w-xs">
            <input
              autoFocus
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddGroup()}
              placeholder="새 그룹 이름"
              className="flex-1 text-sm border border-neutral-200 px-3 py-1.5 rounded focus:outline-none focus:border-neutral-900"
            />
            <button onClick={handleAddGroup} className="bg-neutral-900 text-white px-3 py-1.5 rounded text-xs font-bold">확인</button>
            <button onClick={() => setIsAddingGroup(false)} className="text-neutral-400 p-1.5 hover:text-neutral-900"><X className="w-4 h-4" /></button>
          </div>
        )}

        <div className="grid grid-cols-4 gap-6">
          {filteredTemplates.length === 0 ? (
            <div className="col-span-4 py-20 text-center text-neutral-400 border-2 border-dashed border-neutral-100 rounded-xl">
              선택한 그룹에 보관된 템플릿이 없습니다.
            </div>
          ) : (
            filteredTemplates.map(t => (
              <div
                key={t.id}
                onClick={() => applyTemplate(t)}
                className={`group relative aspect-[9/16] max-w-[200px] mx-auto w-full border-4 rounded-[2.5rem] bg-[#f8fbff] shadow-sm cursor-pointer transition-all hover:shadow-xl hover:-translate-y-2 ${selectedTemplate?.id === t.id ? 'border-[#21358D] ring-4 ring-[#21358D]/10' : 'border-neutral-900'}`}
              >
                {/* Smartphone Mockup: Notch & Status Bar */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-neutral-900 rounded-b-xl z-20" />
                <div className="px-4 py-8 h-full flex flex-col">
                  <div className="flex justify-between items-center text-[8px] font-bold text-neutral-400 mb-4 px-1">
                    <span>9:41</span>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full border border-neutral-300" />
                      <div className="w-3 h-2 bg-neutral-400 rounded-sm" />
                    </div>
                  </div>

                  {/* 템플릿 본문 (말풍선 스타일) */}
                  <div className="flex-1 overflow-hidden">
                    <div className="inline-block max-w-[90%] bg-white border border-neutral-200 rounded-2xl rounded-tl-none p-3 shadow-sm mb-2">
                      <div className="text-[10px] font-bold text-neutral-800 mb-1 line-clamp-1">{t.name}</div>
                      <div className="text-[9px] text-neutral-500 leading-normal line-clamp-6">{t.message}</div>
                    </div>
                    {t.subject && (
                      <div className="inline-block max-w-[80%] bg-[#21358D]/10 text-[#21358D] text-[8px] px-2 py-1 rounded-full mt-1">
                        # {t.subject}
                      </div>
                    )}
                  </div>

                  {/* 바닥바 */}
                  <div className="w-10 h-1 bg-neutral-200 rounded-full mx-auto mt-4" />
                </div>
                
                {/* 오버레이 뱃지 */}
                {selectedTemplate?.id === t.id && (
                  <div className="absolute inset-0 bg-[#21358D]/5 rounded-[2rem] flex items-center justify-center">
                    <div className="bg-[#21358D] text-white p-2 rounded-full shadow-lg">
                      <Check className="w-5 h-5" />
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* ── 좌측: 메시지 에디터 ── */}
        <div className="col-span-8 flex flex-col border border-neutral-200 bg-white min-h-[580px]">

          {/* 헤더 */}
          <div className="border-b border-neutral-200 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 text-xs font-bold rounded ${msgType === 'SMS' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{msgType}</span>
              <span className={`text-xs ${isOverLimit ? 'text-red-600 font-bold' : 'text-neutral-400'}`}>
                {byteSize} / {maxBytes} byte
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPrefixWord(prefixWord ? '' : '(광고)')}
                className={`text-xs px-2 py-1 border transition-colors ${prefixWord ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-300 text-neutral-600 hover:bg-neutral-50'}`}
              >
                광고
              </button>
              <div className="flex items-center gap-1 border-l border-neutral-200 pl-2">
                <button onClick={() => insertPlaceholder('%이름%')} className="text-[10px] px-1.5 py-1 border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 rounded text-neutral-600">이름</button>
                <button onClick={() => insertPlaceholder('%병원명%')} className="text-[10px] px-1.5 py-1 border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 rounded text-neutral-600">병원명</button>
                <button onClick={() => insertPlaceholder('%포인트%')} className="text-[10px] px-1.5 py-1 border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 rounded text-neutral-600">포인트</button>
              </div>
              <button
                onClick={() => setIsPreview(!isPreview)}
                className={`text-xs px-2 py-1 border transition-colors ${isPreview ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-300 text-neutral-600 hover:bg-neutral-50'}`}
              >
                {isPreview ? '편집' : '미리보기'}
              </button>
              <button
                onClick={handleSaveTemplate}
                className="text-xs px-2 py-1 border border-neutral-300 text-neutral-600 hover:bg-neutral-50"
              >
                템플릿 저장
              </button>
            </div>
          </div>

          {/* 제목 (LMS일 때만) */}
          {msgType === 'LMS' && (
            <div className="px-4 pt-3">
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value.slice(0, 30))}
                placeholder="제목 (최대 30자)"
                className="w-full border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:border-neutral-900"
              />
            </div>
          )}

          {/* 광고 접두어 표시 */}
          {prefixWord && !isPreview && (
            <div className="px-4 pt-2">
              <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 border border-orange-200">{prefixWord}</div>
            </div>
          )}

          {/* 메시지 본문 */}
          <div className="flex-1 p-4">
            {isPreview ? (
              <div className="text-sm text-neutral-800 whitespace-pre-wrap leading-relaxed">
                {prefixWord && <span className="text-orange-600">{prefixWord}{'\n'}</span>}
                {getPreviewMessage()}
              </div>
            ) : (
              <textarea
                ref={textareaRef}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="고객에게 전달할 메시지를 입력하세요. (SMS: 90byte / LMS: 2,000byte)"
                className={`w-full h-full min-h-[300px] resize-none text-sm text-neutral-800 focus:outline-none leading-relaxed ${isOverLimit ? 'text-red-600' : ''}`}
              />
            )}
          </div>

          {/* URL 첨부 패널 */}
          <div className="border-t border-neutral-100 p-3 bg-neutral-50/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-tight">첨부 URL</span>
              <span className="text-[10px] text-neutral-400">{urlList.length}/10</span>
            </div>
            <div className="flex gap-1 mb-2">
              <input
                type="text"
                value={newUrl}
                onChange={e => setNewUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && newUrl.trim() && (setUrlList([...urlList, newUrl.trim()]), setNewUrl(''))}
                placeholder="https://..."
                className="flex-1 text-xs border border-neutral-300 px-2 py-1.5 focus:outline-none focus:border-neutral-900 bg-white"
              />
              <button
                onClick={() => { if (newUrl.trim()) { setUrlList([...urlList, newUrl.trim()]); setNewUrl(''); } }}
                className="px-2 py-1 bg-neutral-900 text-white rounded"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-1">
              {urlList.map((url, idx) => (
                <div key={idx} className="flex items-center justify-between bg-white border border-neutral-200 px-2 py-1 rounded">
                  <span className="text-[10px] text-neutral-600 truncate flex-1">{url}</span>
                  <button onClick={() => setUrlList(urlList.filter((_, i) => i !== idx))} className="text-neutral-400 hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 바이트 경고 */}
          {isOverLimit && (
            <div className="px-4 pb-3 flex items-center gap-1 text-xs text-red-600">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>메시지 길이를 줄여주세요.</span>
            </div>
          )}
        </div>

        {/* ── 우측: 수신 대상 ── */}
        <div className="col-span-4 flex flex-col border border-neutral-200 bg-white">
          <div className="border-b border-neutral-200 px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-neutral-800">수신 대상</span>
            <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">{recipients.length}명</span>
          </div>

          {/* 회원 검색 */}
          <div className="p-3 border-b border-neutral-100">
            <p className="text-xs text-neutral-500 mb-2 font-medium">회원 검색</p>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={e => searchMembers(e.target.value)}
                placeholder="이름, 병원명, 이메일..."
                className="w-full text-sm border border-neutral-300 px-3 py-1.5 focus:outline-none focus:border-neutral-900"
              />
              {loadingMembers && <Loader2 className="absolute right-2.5 top-2 w-4 h-4 animate-spin text-neutral-400" />}
            </div>
            {memberResults.length > 0 && (
              <div className="border border-neutral-200 mt-1 max-h-40 overflow-y-auto">
                {memberResults.map((m: any) => (
                  <button
                    key={m.id}
                    onClick={() => addMemberRecipient(m)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-neutral-50 border-b border-neutral-100 last:border-0"
                  >
                    <div className="font-medium">{m.name}</div>
                    <div className="text-neutral-500">{m.hospitalName} · {m.phone || '번호없음'}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 직접 입력 */}
          <div className="p-3 border-b border-neutral-100">
            <p className="text-xs text-neutral-500 mb-2 font-medium">직접 입력</p>
            <div className="flex gap-1 mb-1">
              <input type="text" value={directName} onChange={e => setDirectName(e.target.value)} placeholder="이름" className="w-20 text-sm border border-neutral-300 px-2 py-1.5 focus:outline-none" />
              <input type="text" value={directPhone} onChange={e => setDirectPhone(e.target.value)} onKeyDown={e => e.key === 'Enter' && addDirectRecipient()} placeholder="01012345678" className="flex-1 text-sm border border-neutral-300 px-2 py-1.5 focus:outline-none" />
              <button onClick={addDirectRecipient} className="px-2 py-1.5 bg-neutral-900 text-white text-xs"><Plus className="w-3.5 h-3.5" /></button>
            </div>
          </div>

          {/* CSV/Excel 업로드 */}
          <div className="p-3 border-b border-neutral-100">
            <p className="text-xs text-neutral-500 mb-2 font-medium">Excel/CSV 업로드</p>
            <input ref={fileInputRef} type="file" accept=".csv, .xlsx, .xls" onChange={handleFileUpload} className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-1.5 border border-dashed border-neutral-300 text-xs text-neutral-500 hover:bg-neutral-50 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              파일 선택 (이름, 번호, 병원, 포인트)
            </button>
          </div>

          {/* 대상 목록 */}
          <div className="flex-1 overflow-y-auto">
            {recipients.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-neutral-400 text-xs gap-1">
                <Users className="w-8 h-8 opacity-30" />
                <span>수신 대상을 추가하세요</span>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {recipients.map((r, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2 text-xs border-b border-neutral-50 last:border-0 hover:bg-neutral-50/50">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-neutral-800">{r.name}</span>
                        <span className="text-neutral-400">{r.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                        {r.hospitalName && <span className="text-neutral-500 bg-neutral-100 px-1 rounded">{r.hospitalName}</span>}
                        {r.points !== undefined && <span className="text-blue-500 font-medium">{r.points.toLocaleString()}P</span>}
                      </div>
                    </div>
                    <button onClick={() => setRecipients(prev => prev.filter((_, idx) => idx !== i))} className="text-neutral-300 hover:text-red-500 transition-colors pl-2">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 전체 삭제 */}
          {recipients.length > 0 && (
            <div className="px-4 py-2 border-t border-neutral-100">
              <button onClick={() => setRecipients([])} className="text-xs text-neutral-400 hover:text-red-500 transition-colors">
                전체 삭제 ({recipients.length}명)
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-neutral-200 p-4 flex items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          {/* 발송 방식 */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer text-sm">
              <input type="radio" value="immediate" checked={sendMode === 'immediate'} onChange={() => setSendMode('immediate')} />
              즉시 발송
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-sm">
              <input type="radio" value="reserved" checked={sendMode === 'reserved'} onChange={() => setSendMode('reserved')} />
              예약 발송
            </label>
          </div>
          {sendMode === 'reserved' && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-neutral-400" />
              <input type="date" value={reservedDate} onChange={e => setReservedDate(e.target.value)} className="text-sm border border-neutral-300 px-2 py-1 focus:outline-none" />
              <input type="time" value={reservedTime} onChange={e => setReservedTime(e.target.value)} className="text-sm border border-neutral-300 px-2 py-1 focus:outline-none" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-neutral-500">
            총 {recipients.length}명 선택 (보유: {credit !== null ? credit.toLocaleString() : '...'}개)
          </div>
          <Button
            onClick={handleSend}
            disabled={sending || recipients.length === 0 || !message.trim() || isOverLimit}
            className="flex items-center gap-2 px-6"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sendMode === 'reserved' ? '예약 발송' : '즉시 발송'}
          </Button>
        </div>
      </div>
    </div>
  );
}
