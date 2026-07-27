import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Send, Plus, Trash2, Edit2, Check, X, ChevronRight, Users, Upload, Smartphone, AlertCircle, Clock, Loader2, Mail, RefreshCw, Sliders, History, Folder, AlertTriangle } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { mtsService, DEFAULT_FROM_PHONE, type SmsTemplateGroup, type SmsTemplate } from '../../../services/mtsService';
import { adminService } from '../../../services/adminService';
import { toast } from 'sonner';
import { useModal } from '../../../context/ModalContext';

import { equipmentService, type EquipmentModel } from '../../../services/equipmentService';

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

  const [isSegmentOpen, setIsSegmentOpen] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['병원', '대리점']);
  const [equipments, setEquipments] = useState<EquipmentModel[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string>('all');
  const [moveGroupTarget, setMoveGroupTarget] = useState<SmsTemplate | null>(null);

  const [sendMode, setSendMode] = useState<'immediate' | 'reserved'>('immediate');
  const [reservedDate, setReservedDate] = useState('');
  const [reservedTime, setReservedTime] = useState('');
  const [sending, setSending] = useState(false);
  const [credit, setCredit] = useState<number | null>(52);
  const [storeId] = useState('70000');
  const [fromPhone] = useState(DEFAULT_FROM_PHONE);

  const msgType = mtsService.getMessageType(message, subject);
  const byteSize = mtsService.getByteSize(message);
  const maxBytes = mtsService.getMaxBytes(msgType === 'MMS' ? 'LMS' : msgType);
  const isOverLimit = byteSize > maxBytes;
  const filteredTemplates = selectedGroup
    ? templates.filter(t => t.group_id === selectedGroup.id)
    : templates;

  useEffect(() => {
    loadGroups(); loadTemplates(); loadCredit(); loadEquipments();
  }, []);

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
    const name = window.prompt('템플릿 이름을 입력하세요:');
    if (!name) return;
    try {
      if (selectedTemplate?.id) {
        await mtsService.updateTemplate(selectedTemplate.id, { name, subject: subject || null, message, prefix_word: prefixAd ? '(광고)' : null, group_id: selectedGroup?.id || null });
        toast.success('템플릿이 수정되었습니다.');
      } else {
        await mtsService.createTemplate({ name, subject: subject || null, message, prefix_word: prefixAd ? '(광고)' : null, group_id: selectedGroup?.id || null });
        toast.success('새 템플릿이 저장되었습니다.');
      }
      await loadTemplates();
    } catch { toast.error('템플릿 저장에 실패했습니다.'); }
  };

  const handleReset = () => { setMessage(''); setSubject(''); setPrefixAd(false); setRecipients([]); setSelectedTemplate(null); toast.info('전송 폼이 초기화되었습니다.'); };

  const handleSend = async () => {
    if (!recipients.length) { toast.error('수신 대상을 추가하세요.'); return; }
    if (!message.trim()) { toast.error('메시지를 입력하세요.'); return; }
    if (isOverLimit) { toast.error('글자수 제한을 초과했습니다.'); return; }
    const ok = await confirm({ title: '메시지 발송', description: `${recipients.length}명에게 발송하시겠습니까?`, confirmText: '발송', cancelText: '취소' });
    if (!ok) return;
    setSending(true);
    try {
      const finalMsg = prefixAd ? `(광고)\n${message}\n무료수신거부 080-123-4567` : message;
      await mtsService.sendBulkSms({ fromPhone, subject: subject || undefined, message: finalMsg, purpose: 'mkt', recipients, storeId });
      toast.success(`${recipients.length}명 발송 완료!`);
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
            <Sliders className="w-3.5 h-3.5" /> 고객 조회 조건
          </button>
          <button onClick={() => navigate('/admin/marketing/sms/history')} className="flex items-center gap-1.5 border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 px-3 py-1.5 rounded text-xs font-semibold transition-colors">
            <History className="w-3.5 h-3.5" /> 전송 내역
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'row', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        <div style={{ width: 420, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'white', borderRight: '1px solid #e5e7eb' }}>
          <div className="border-b border-neutral-200 bg-white px-2 pt-2.5 pb-0 flex items-center justify-between">
            <div className="flex items-center gap-x-1 gap-y-0 flex-wrap flex-1">
              <button
                onClick={() => setSelectedGroup(null)}
                className={`flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-t transition-colors border-b-2 whitespace-nowrap ${
                  !selectedGroup ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                전체보기
              </button>
              {groups.map(g => (
                <div key={g.id} className="group relative flex-shrink-0">
                  {editingGroupId === g.id ? (
                    <div className="flex items-center gap-1 px-1">
                      <input
                        autoFocus
                        value={editingGroupName}
                        onChange={e => setEditingGroupName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleUpdateGroup(g.id); if (e.key === 'Escape') setEditingGroupId(null); }}
                        className="w-20 text-xs border border-neutral-300 px-1.5 py-0.5 rounded focus:outline-none"
                      />
                      <button onClick={() => handleUpdateGroup(g.id)} className="text-green-500"><Check className="w-3 h-3" /></button>
                      <button onClick={() => setEditingGroupId(null)} className="text-neutral-400"><X className="w-3 h-3" /></button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedGroup(g)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-t whitespace-nowrap transition-colors border-b-2 ${
                        selectedGroup?.id === g.id ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'
                      }`}
                    >
                      {g.name}
                    </button>
                  )}
                </div>
              ))}
              <button onClick={() => setIsAddingGroup(true)} className="flex-shrink-0 p-1.5 text-neutral-400 hover:text-blue-500 ml-auto" title="그룹 추가">
                <Plus className="w-3.5 h-3.5" />
              </button>
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
                      <div className="flex flex-col" style={{ padding: 10, height: 'calc(100% - 36px)', overflow: 'hidden' }}>
                        <div className="text-[8px] text-neutral-400 mb-0.5 leading-none">{groupName || '일반'}</div>
                        <div className="text-[8px] text-neutral-700 leading-snug mb-1 line-clamp-1">{t.name}</div>
                        <div className="border-t border-neutral-100 mb-1" />
                        {t.subject && <div className="text-[8px] text-neutral-900 leading-snug mb-0.5 line-clamp-1">{t.subject}</div>}
                        <p className="text-[8px] text-neutral-500 leading-snug line-clamp-6 whitespace-pre-line flex-1">{t.message}</p>
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

        <div style={{ width: 340, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'white', borderLeft: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb' }}>
          <div className="bg-blue-600 px-4 py-3 flex items-center justify-between shrink-0">
            <div className="text-white">
              <div className="font-bold text-base leading-tight">제이시스 메디컬</div>
              <div className="text-blue-100 text-xs font-mono">{fromPhone}</div>
            </div>
            <button
              onClick={handleSaveTemplate}
              className="flex items-center gap-1.5 bg-white text-blue-600 hover:bg-blue-50 text-xs font-bold px-3 py-1.5 rounded shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> 템플릿 추가
            </button>
          </div>
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value.slice(0, 30))}
            placeholder="제목을 입력해 메시지를 보낼 수 있습니다. (30자)"
            className="w-full border-b border-neutral-200 px-4 py-2.5 text-sm text-neutral-700 focus:outline-none placeholder:text-neutral-400 placeholder:text-xs shrink-0"
          />
          <div className="flex-1 flex flex-col min-h-0 relative bg-blue-500/5">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="선택된 고객에게 전달할 메시지를 작성해 주세요. (900자)"
              className={`flex-1 w-full p-4 text-sm leading-relaxed resize-none focus:outline-none bg-transparent placeholder:text-neutral-400 placeholder:text-xs min-h-[140px] ${isOverLimit ? 'text-red-600' : 'text-neutral-800'}`}
            />
          </div>
          <div className="flex items-center justify-between px-4 py-2 bg-white border-t border-neutral-200 shrink-0">
            <span className="text-blue-500 text-xs font-medium">미리보기</span>
            <span className={`text-xs font-mono ${isOverLimit ? 'text-red-500 font-bold' : 'text-neutral-400'}`}>({byteSize}/{maxBytes})</span>
          </div>
          <div className="grid grid-cols-2 gap-0 border-t border-neutral-200 shrink-0 bg-neutral-50">
            <button onClick={() => insertPlaceholder('{고객명}')} className="py-2 text-xs font-bold bg-white text-blue-600 hover:bg-blue-50 transition-colors border-r border-neutral-200 flex items-center justify-center">+ 고객명</button>
            <button onClick={() => insertPlaceholder('{병원명}')} className="py-2 text-xs font-bold bg-white text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center">+ 병원명</button>
          </div>
          <div className="px-4 py-3 bg-white border-t border-neutral-200 shrink-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-bold text-neutral-900">전송 대상 <span className="text-blue-500">{recipients.length}명</span></span>
              <div className="flex items-center gap-3 text-xs">
                <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="sendMode" value="immediate" checked={sendMode === 'immediate'} onChange={() => setSendMode('immediate')} className="accent-blue-500" /><span className="text-neutral-700">즉시</span></label>
                <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="sendMode" value="reserved" checked={sendMode === 'reserved'} onChange={() => setSendMode('reserved')} className="accent-blue-500" /><span className="text-neutral-700">예약</span></label>
              </div>
            </div>
            <button
              onClick={handleSend}
              disabled={sending || !recipients.length || !message.trim() || isOverLimit}
              className="w-full py-3.5 bg-blue-500 hover:bg-blue-600 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white font-extrabold text-base rounded transition-colors flex items-center justify-center gap-2"
            >
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              메시지 전송
            </button>
          </div>
        </div>

        <div style={{ width: 340, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'white', borderLeft: '1px solid #e5e7eb' }}>
          <div className="flex items-center justify-between px-3 pt-2 pb-1 border-b border-neutral-200 shrink-0 bg-neutral-50">
            <div className="flex items-end gap-1">
              <button onClick={() => setRecipientView('list')} className={`px-3 py-1.5 text-xs font-bold border-b-2 transition-colors ${recipientView === 'list' ? 'border-blue-500 text-blue-600 bg-white' : 'border-transparent text-neutral-500 hover:text-neutral-800'}`}>선택 ({recipients.length})</button>
              <button onClick={() => setRecipientView('blocked')} className={`px-3 py-1.5 text-xs font-bold border-b-2 transition-colors ${recipientView === 'blocked' ? 'border-blue-500 text-blue-600 bg-white' : 'border-transparent text-neutral-500 hover:text-neutral-800'}`}>수신거부</button>
            </div>
            <button
              onClick={() => setIsSegmentOpen(true)}
              className="flex items-center gap-1 bg-neutral-900 hover:bg-neutral-700 text-white px-2.5 py-1 rounded text-xs font-semibold transition-colors"
            >
              <Sliders className="w-3 h-3" /> 대상고객 필터
            </button>
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
                      <div className="font-bold text-neutral-800">{r.name}</div>
                      <div className="text-neutral-400">{r.phone}</div>
                    </div>
                    <button onClick={() => setRecipients(prev => prev.filter((_, idx) => idx !== i))} className="text-neutral-300 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
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
                {['병원', '대리점', '홀딩스', '학회', '기타'].map(type => {
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
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">최근 구매일자</label>
              <div className="flex gap-2">
                <input type="date" className="w-full text-xs border border-neutral-300 rounded px-3 py-2 focus:outline-none" />
                <span className="self-center text-xs text-neutral-400">~</span>
                <input type="date" className="w-full text-xs border border-neutral-300 rounded px-3 py-2 focus:outline-none" />
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
              <label className="block text-xs font-bold text-neutral-700 mb-1">누적 구매/매출 금액 기준</label>
              <input type="number" placeholder="최소 누적 매출 금액 (예: 1,000,000원)" className="w-full text-xs border border-neutral-300 rounded px-3 py-2 focus:outline-none" />
            </div>
          </div>
          <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 flex justify-end gap-2">
            <button onClick={() => setIsSegmentOpen(false)} className="px-4 py-2 border border-neutral-300 text-neutral-600 text-xs font-semibold rounded hover:bg-neutral-100">
              취소
            </button>
            <button
              onClick={() => {
                toast.success('조회 조건이 적용되어 수신 대상 12명이 검색되었습니다.');
                setRecipients([
                  { name: '김원장', phone: '010-1234-5678', hospitalName: '제이의원' },
                  { name: '이원장', phone: '010-9876-5432', hospitalName: '시스피부과' },
                  { name: '박원장', phone: '010-5555-7777', hospitalName: '메디컬의원' },
                ]);
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
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-200">
            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <Folder className="w-4 h-4 text-green-600" /> 템플릿 그룹 이동
            </h3>
            <button onClick={() => setMoveGroupTarget(null)} className="text-neutral-400 hover:text-neutral-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-5 space-y-3">
            <p className="text-xs text-neutral-600">
              <strong className="text-neutral-900">[{moveGroupTarget.name}]</strong> 템플릿을 이동할 분류를 선택해 주세요.
            </p>
            <div className="space-y-1.5 pt-1">
              <button
                onClick={async () => {
                  try {
                    await mtsService.updateTemplate(moveGroupTarget.id, { group_id: null });
                    toast.success('템플릿이 [전체보기/미지정]으로 이동되었습니다.');
                    await loadTemplates();
                    setMoveGroupTarget(null);
                  } catch { toast.error('그룹 이동에 실패했습니다.'); }
                }}
                className={`w-full text-left px-3 py-2 text-xs font-semibold rounded border transition-colors ${
                  !moveGroupTarget.group_id ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                전체보기 (미지정)
              </button>
              {groups.map(g => (
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
                  className={`w-full text-left px-3 py-2 text-xs font-semibold rounded border transition-colors ${
                    moveGroupTarget.group_id === g.id ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  {g.name}
                </button>
              ))}
            </div>
          </div>
          <div className="px-5 py-3 bg-neutral-50 border-t border-neutral-200 flex justify-end">
            <button onClick={() => setMoveGroupTarget(null)} className="px-3 py-1.5 border border-neutral-300 text-neutral-600 text-xs font-semibold rounded hover:bg-neutral-100">
              취소
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
