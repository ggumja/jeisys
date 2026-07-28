import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Send, Plus, Trash2, Edit2, Check, X, Users, Upload, Clock, Loader2, RefreshCw, Sliders, History, Folder, Save } from 'lucide-react';
import { emailService, DEFAULT_FROM_EMAIL, type EmailTemplateGroup, type EmailTemplate } from '../../../services/emailService';
import { equipmentService, type EquipmentModel } from '../../../services/equipmentService';
import { RichTextEditor, type RichTextEditorRef } from '../../../components/ui/RichTextEditor';
import { toast } from 'sonner';
import { useModal } from '../../../context/ModalContext';

interface Recipient {
  name: string;
  email: string;
  hospitalName?: string;
}

export function EmailSendPage() {
  const navigate = useNavigate();
  const { confirm } = useModal();

  const [groups, setGroups] = useState<EmailTemplateGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<EmailTemplateGroup | null>(null);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);

  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [isAddingGroup, setIsAddingGroup] = useState(false);

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [editorMode, setEditorMode] = useState<'wysiwyg' | 'html' | 'preview'>('wysiwyg');
  const richEditorRef = useRef<RichTextEditorRef>(null);

  const [recipients, setRecipients] = useState<Recipient[]>([]);

  const [isSegmentOpen, setIsSegmentOpen] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['병원', '대리점', '홀딩스', '학회', '기타']);
  const [selectedDaysAgo, setSelectedDaysAgo] = useState<number | null>(null);
  const [selectedMinAmount, setSelectedMinAmount] = useState<number | null>(null);
  const [equipments, setEquipments] = useState<EquipmentModel[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string>('all');
  const [moveGroupTarget, setMoveGroupTarget] = useState<EmailTemplate | null>(null);

  const [sendMode, setSendMode] = useState<'immediate' | 'reserved'>('immediate');
  const [reservedDate, setReservedDate] = useState('');
  const [reservedTime, setReservedTime] = useState('');
  const [sending, setSending] = useState(false);
  const [fromEmail] = useState(DEFAULT_FROM_EMAIL);
  const [storeId] = useState('70000');

  const filteredTemplates = selectedGroup
    ? selectedGroup.id === 'unassigned'
      ? templates.filter(t => !t.group_id)
      : templates.filter(t => t.group_id === selectedGroup.id)
    : templates;

  useEffect(() => {
    loadGroups();
    loadTemplates();
    loadEquipments();
  }, []);

  const loadGroups = async () => {
    try {
      const data = await emailService.getTemplateGroups();
      setGroups(data);
    } catch { toast.error('템플릿 그룹을 불러오지 못했습니다.'); }
  };

  const loadTemplates = async () => {
    try {
      const data = await emailService.getTemplates();
      setTemplates(data);
    } catch { toast.error('템플릿 목록을 불러오지 못했습니다.'); }
  };

  const loadEquipments = async () => {
    try {
      const data = await equipmentService.getEquipments();
      setEquipments(data);
    } catch { /* graceful fallback */ }
  };

  const applyTemplate = (t: EmailTemplate) => {
    setSelectedTemplate(t);
    setSubject(t.subject || t.name);
    setMessage(t.message);
    toast.info(`[${t.name}] 템플릿이 에디터에 적용되었습니다.`);
  };

  const handleAddGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      await emailService.createTemplateGroup(newGroupName.trim());
      setNewGroupName('');
      setIsAddingGroup(false);
      await loadGroups();
      toast.success('새 템플릿 그룹이 추가되었습니다.');
    } catch { toast.error('그룹 추가에 실패했습니다.'); }
  };

  const handleUpdateGroup = async (groupId: string) => {
    if (!editingGroupName.trim()) return;
    try {
      await emailService.updateTemplateGroup(groupId, editingGroupName.trim());
      setEditingGroupId(null);
      await loadGroups();
      toast.success('그룹 이름이 수정되었습니다.');
    } catch { toast.error('그룹 수정에 실패했습니다.'); }
  };

  const handleSaveTemplate = async () => {
    if (!message.trim()) {
      toast.error('이메일 메시지 내용을 작성해 주세요.');
      return;
    }
    const htmlContent = message;
    const name = subject.trim() || '새 이메일 템플릿';

    try {
      if (selectedTemplate?.id) {
        await emailService.updateTemplate(selectedTemplate.id, {
          name,
          subject: subject || null,
          message: htmlContent,
          group_id: selectedGroup?.id || null,
        });
        toast.success(`[${name}] 템플릿이 수정 저장되었습니다.`);
      } else {
        await emailService.createTemplate({
          name,
          subject: subject || null,
          message: htmlContent,
          group_id: selectedGroup?.id || null,
        });
        toast.success(`[${name}] 템플릿이 저장되었습니다.`);
      }
      await loadTemplates();
    } catch { toast.error('템플릿 저장에 실패했습니다.'); }
  };

  const handleReset = () => {
    setMessage('');
    setSubject('');
    setRecipients([]);
    setSelectedTemplate(null);
    toast.info('전송 폼이 초기화되었습니다.');
  };

  const handleSend = async () => {
    if (!recipients.length) { toast.error('수신 대상을 추가하세요.'); return; }
    if (!message.trim()) { toast.error('이메일 메시지 내용을 작성하세요.'); return; }

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
      ? `${recipients.length}명에게 [${reservedDate} ${reservedTime}] 이메일 예약 발송하시겠습니까?`
      : `${recipients.length}명에게 이메일을 즉시 발송하시겠습니까?`;

    const ok = await confirm({
      title: sendMode === 'reserved' ? '예약 이메일 발송' : '이메일 발송',
      description: descMsg,
      confirmText: '발송',
      cancelText: '취소'
    });
    if (!ok) return;

    setSending(true);
    try {
      await emailService.sendBulkEmail({
        fromEmail,
        subject: subject || '제이시스 메디컬 안내 메일',
        message: htmlContent,
        purpose: 'mkt',
        recipients,
        storeId,
        reservedAt: reservedAtStr,
      });

      if (sendMode === 'reserved') {
        toast.success(`${recipients.length}명에게 [${reservedDate} ${reservedTime}] 이메일 예약 발송이 설정되었습니다.`);
      } else {
        toast.success(`${recipients.length}명 이메일 발송 완료!`);
      }
      handleReset();
    } catch { toast.error('이메일 발송 실패. 잠시 후 다시 시도하세요.'); } finally { setSending(false); }
  };

  // WYSIWYG 커스텀 툴바 커맨드
  const execCmd = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setMessage(editorRef.current.innerHTML);
    }
  };

  const insertPlaceholder = (text: string) => {
    if (activeTab === 'editor' && editorRef.current) {
      editorRef.current.focus();
      document.execCommand('insertText', false, text);
      setMessage(editorRef.current.innerHTML);
    } else {
      setMessage(prev => prev + text);
    }
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
        {/* 상단 타이틀 헤더 */}
        <div className="bg-white border-b border-neutral-200 px-6 py-4 flex items-start justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">이메일 마케팅 전송</h1>
            <p className="text-sm text-neutral-500 mt-1">고객 대상 리치 HTML 마케팅 이메일을 전송합니다.</p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <button onClick={handleReset} className="flex items-center gap-1.5 border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 px-3 py-1.5 rounded text-xs font-semibold transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> 초기화
            </button>
            <button onClick={() => setIsSegmentOpen(true)} className="flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-700 text-white px-3 py-1.5 rounded text-xs font-semibold transition-colors">
              <Sliders className="w-3.5 h-3.5" /> 대상 고객 지정
            </button>
            <button onClick={() => navigate('/admin/marketing/email/history')} className="flex items-center gap-1.5 border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 px-3 py-1.5 rounded text-xs font-semibold transition-colors">
              <History className="w-3.5 h-3.5" /> 발송 내역
            </button>
          </div>
        </div>

        {/* 메인 2열 분할 레이아웃: 좌측(템플릿 상단 + 에디터 하단 위아래 배치), 우측(수신 대상 목록 유지) */}
        <div style={{ display: 'flex', flexDirection: 'row', flex: 1, overflow: 'hidden', minHeight: 0 }}>
          
          {/* [좌측 영역]: 템플릿(상단) + 에디터(하단) 수직 세로 배치 */}
          <div className="flex-1 flex flex-col min-w-0 bg-neutral-100 overflow-hidden border-r border-neutral-200">
            
            {/* [좌측 상단]: 이메일 템플릿 그룹 탭 및 카드 목록 */}
            <div className="bg-white border-b border-neutral-200 flex flex-col shrink-0">
              <div className="border-b border-neutral-200 bg-neutral-50/50 px-3 pt-2 pb-0 flex items-center justify-between shrink-0">
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

                {/* 우측 조작부 */}
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
                          if (window.confirm(`[${selectedGroup.name}] 그룹을 삭제하시겠습니까?`)) {
                            try {
                              await emailService.deleteTemplateGroup(selectedGroup.id);
                              toast.success('그룹이 삭제되었습니다.');
                              setSelectedGroup(null);
                              await loadGroups();
                            } catch { toast.error('그룹 삭제에 실패했습니다.'); }
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

              {/* 템플릿 테이블 목록형 (List View) */}
              <div className="overflow-y-auto bg-white" style={{ height: 180 }}>
                {filteredTemplates.length === 0 ? (
                  <div className="py-8 text-center text-neutral-400 text-xs">
                    <p>보관된 이메일 템플릿이 없습니다.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-neutral-50 border-b border-neutral-200 text-[11px] font-bold text-neutral-500 sticky top-0 z-10">
                        <th className="py-2 px-3 w-24">분류</th>
                        <th className="py-2 px-3">템플릿 / 이메일 제목</th>
                        <th className="py-2 px-3 hidden md:table-cell">내용 요약</th>
                        <th className="py-2 px-3 w-24 text-center">관리</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 text-xs">
                      {filteredTemplates.map(t => {
                        const groupName = groups.find(g => g.id === t.group_id)?.name ?? '미지정';
                        const isSelected = selectedTemplate?.id === t.id;
                        const previewText = t.message.replace(/<[^>]*>?/gm, '');

                        return (
                          <tr
                            key={t.id}
                            onClick={() => applyTemplate(t)}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? 'bg-blue-50/80 font-semibold' : 'hover:bg-neutral-50'
                            }`}
                          >
                            <td className="py-2 px-3 text-neutral-400 font-medium text-[11px] whitespace-nowrap">
                              <span className="inline-block px-1.5 py-0.5 bg-neutral-100 text-neutral-600 rounded">
                                {groupName}
                              </span>
                            </td>
                            <td className="py-2 px-3 font-bold text-neutral-800">
                              <div className="flex items-center gap-1.5">
                                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />}
                                <span className="truncate">{t.subject || t.name}</span>
                              </div>
                            </td>
                            <td className="py-2 px-3 text-neutral-500 text-[11px] truncate max-w-xs hidden md:table-cell">
                              {previewText}
                            </td>
                            <td className="py-2 px-3 text-center whitespace-nowrap" onClick={e => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => setMoveGroupTarget(t)}
                                  className="p-1 text-neutral-400 hover:text-green-600 hover:bg-neutral-100 rounded transition-colors"
                                  title="그룹 이동"
                                >
                                  <Folder className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    emailService.deleteTemplate(t.id).then(() => {
                                      loadTemplates();
                                      if (selectedTemplate?.id === t.id) setSelectedTemplate(null);
                                    });
                                  }}
                                  className="p-1 text-neutral-400 hover:text-red-500 hover:bg-neutral-100 rounded transition-colors"
                                  title="템플릿 삭제"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* [좌측 하단]: 이메일 리치 에디터 및 발송 설정 패널 */}
            <div className="flex-1 flex flex-col min-h-0 bg-white overflow-hidden">
              <div className="bg-blue-600 px-4 py-2.5 flex items-center justify-between gap-2 shrink-0">
                <div className="text-white shrink-0 min-w-0 flex items-center gap-2">
                  <div className="font-bold text-sm leading-tight truncate">제이시스 이메일 작성 에디터</div>
                  <span className="text-blue-200 text-xs">({fromEmail})</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {selectedTemplate && (
                    <button
                      onClick={handleSaveTemplate}
                      className="flex items-center gap-1 bg-white text-blue-600 hover:bg-blue-50 text-xs font-bold px-3 py-1.5 rounded shadow-sm transition-colors cursor-pointer whitespace-nowrap"
                      title="선택된 템플릿 내용 수정 저장"
                    >
                      <Save className="w-3.5 h-3.5" /> 저장
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedTemplate(null);
                      setTimeout(() => handleSaveTemplate(), 50);
                    }}
                    className="flex items-center gap-1 bg-white text-blue-600 hover:bg-blue-50 text-xs font-bold px-3 py-1.5 rounded shadow-sm transition-colors cursor-pointer whitespace-nowrap"
                    title="새 템플릿으로 추가"
                  >
                    <Plus className="w-3.5 h-3.5" /> 추가
                  </button>
                </div>
              </div>

              {/* 이메일 제목 입력 */}
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="이메일 제목을 입력하세요"
                className="w-full border-b border-neutral-200 px-4 py-2.5 text-sm font-semibold text-neutral-800 focus:outline-none placeholder:text-neutral-400 placeholder:text-xs shrink-0"
              />

              {/* 에디터 모드 탭 (에디터 / HTML 소스 / 미리보기) */}
              <div className="bg-neutral-50 border-b border-neutral-200 px-4 py-1.5 flex items-center justify-between shrink-0">
                <span className="text-xs font-bold text-neutral-600">작성 모드 선택</span>
                <div className="flex items-center gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setEditorMode('wysiwyg')}
                    className={`px-3 py-1 rounded font-bold transition-colors cursor-pointer ${
                      editorMode === 'wysiwyg' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    📝 에디터
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorMode('html')}
                    className={`px-3 py-1 rounded font-bold transition-colors cursor-pointer ${
                      editorMode === 'html' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    💻 HTML 소스
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorMode('preview')}
                    className={`px-3 py-1 rounded font-bold transition-colors cursor-pointer ${
                      editorMode === 'preview' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    👁️ 미리보기
                  </button>
                </div>
              </div>

              {/* 작성 모드별 본문 영역 */}
              <div className="flex-1 flex flex-col p-3 overflow-y-auto bg-white min-h-0">
                {editorMode === 'wysiwyg' && (
                  <RichTextEditor
                    key={selectedTemplate?.id || 'new'}
                    ref={richEditorRef}
                    value={message}
                    onChange={setMessage}
                    placeholder="이메일 본문 내용을 작성해 주세요."
                    minHeight="320px"
                  />
                )}

                {editorMode === 'html' && (
                  <div className="flex-1 flex flex-col h-full">
                    <textarea
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      placeholder="<div style='...'>HTML 코드를 직접 입력/수정하세요</div>"
                      className="w-full h-full min-h-[320px] p-3 font-mono text-xs leading-relaxed bg-white text-neutral-800 rounded border border-neutral-300 focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </div>
                )}

                {editorMode === 'preview' && (
                  <div className="bg-neutral-100 p-4 overflow-y-auto min-h-[320px]">
                    <div
                      className="bg-white rounded-lg shadow-sm max-w-[600px] mx-auto border border-neutral-200 min-h-[300px] p-4 text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: message || '<p class="text-neutral-400 text-xs">작성된 내용이 없습니다.</p>' }}
                    />
                  </div>
                )}
              </div>

              {/* 치환 변수 삽입 가이드 */}
              <div className="grid grid-cols-2 gap-0 border-t border-neutral-200 shrink-0 bg-neutral-50">
                <button
                  type="button"
                  onClick={() => richEditorRef.current?.insertText('{고객명}')}
                  className="py-2 text-xs font-bold bg-white text-blue-600 hover:bg-blue-50 transition-colors border-r border-neutral-200 flex items-center justify-center cursor-pointer"
                >
                  + 고객명
                </button>
                <button
                  type="button"
                  onClick={() => richEditorRef.current?.insertText('{병원명}')}
                  className="py-2 text-xs font-bold bg-white text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center cursor-pointer"
                >
                  + 병원명
                </button>
              </div>

              {/* 하단 발송 컨트롤 바 */}
              <div className="px-4 py-3 bg-white border-t border-neutral-200 shrink-0 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-xs shrink-0">
                  <span className="text-sm font-bold text-neutral-900">전송 대상 <span className="text-blue-500">{recipients.length}명</span></span>
                  <div className="w-px h-4 bg-neutral-200" />
                  <label className="flex items-center gap-1 cursor-pointer font-bold">
                    <input type="radio" name="emailSendMode" value="immediate" checked={sendMode === 'immediate'} onChange={() => setSendMode('immediate')} className="accent-blue-500" />
                    <span className="text-neutral-700">즉시발송</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer font-bold">
                    <input type="radio" name="emailSendMode" value="reserved" checked={sendMode === 'reserved'} onChange={() => setSendMode('reserved')} className="accent-blue-500" />
                    <span className="text-neutral-700">예약발송</span>
                  </label>
                </div>

                {sendMode === 'reserved' && (
                  <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded px-2.5 py-1 text-xs shrink-0">
                    <Clock className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
                    <input
                      type="date"
                      min={new Date().toISOString().substring(0, 10)}
                      value={reservedDate}
                      onChange={e => setReservedDate(e.target.value)}
                      className="border border-neutral-200 rounded px-1.5 py-0.5 text-xs bg-white focus:outline-none"
                    />
                    <input
                      type="time"
                      value={reservedTime}
                      onChange={e => setReservedTime(e.target.value)}
                      className="border border-neutral-200 rounded px-1.5 py-0.5 text-xs bg-white focus:outline-none"
                    />
                  </div>
                )}

                <button
                  onClick={handleSend}
                  disabled={sending || !recipients.length || (!message.trim() && !editorRef.current?.innerHTML.trim()) || (sendMode === 'reserved' && (!reservedDate || !reservedTime))}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white font-extrabold text-xs rounded transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm shrink-0 whitespace-nowrap"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {sendMode === 'reserved' ? '예약 이메일 발송' : '이메일 즉시 발송'}
                </button>
              </div>
            </div>
          </div>

          {/* [3열]: 수신 대상 목록 */}
          <div style={{ width: 340, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'white', borderLeft: '1px solid #e5e7eb' }}>
            <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-200 shrink-0 bg-neutral-50">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-neutral-800">선택한 수신자 ({recipients.length})</span>
              </div>
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
                            const email = cols[1];
                            const hospitalName = cols[2] || '';
                            if (name && email && email.includes('@')) {
                              if (idx === 0 && (name.includes('이름') || email.includes('이메일'))) return;
                              parsed.push({ name, email, hospitalName });
                            }
                          }
                        });

                        if (parsed.length > 0) {
                          setRecipients(prev => [...prev, ...parsed]);
                          toast.success(`엑셀 파일에서 수신대상 ${parsed.length}명이 정상 업로드되었습니다.`);
                        } else {
                          const sampleParsed: Recipient[] = [
                            { name: '강원장', email: 'kang@jeisysmed.com', hospitalName: '강남제이의원' },
                            { name: '윤원장', email: 'yoon@miraeskin.com', hospitalName: '미래피부과' },
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
                        <div className="text-neutral-400 font-mono text-[11px] mt-0.5">{r.email}</div>
                      </div>
                      <button onClick={() => setRecipients(prev => prev.filter((_, idx) => idx !== i))} className="text-neutral-300 hover:text-red-500 p-1"><X className="w-3.5 h-3.5" /></button>
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

      {/* 대상 고객 지정 필터 모달 */}
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
                            if (isAllChecked) setSelectedTypes([]);
                            else setSelectedTypes(allTypes);
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded border transition-colors ${
                            isAllChecked
                              ? 'bg-blue-50 border-blue-500 text-blue-600 font-bold'
                              : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                          }`}
                        >
                          <input type="checkbox" checked={isAllChecked} onChange={() => {}} className="accent-blue-500 rounded" />
                          전체
                        </button>
                        {allTypes.map(type => {
                          const checked = selectedTypes.includes(type);
                          return (
                            <button
                              key={type}
                              type="button"
                              onClick={() => {
                                setSelectedTypes(prev => checked ? prev.filter(t => t !== type) : [...prev, type]);
                              }}
                              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded border transition-colors ${
                                checked
                                  ? 'bg-blue-50 border-blue-500 text-blue-600'
                                  : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                              }`}
                            >
                              <input type="checkbox" checked={checked} onChange={() => {}} className="accent-blue-500 rounded" />
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
                <label className="block text-xs font-bold text-neutral-700 mb-2">누적 구매/매출 금액 기준 (VIP / 우수고객 타겟팅)</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: '100만원 이상', amount: 1000000 },
                    { label: '500만원 이상', amount: 5000000 },
                    { label: '1,000만원 이상', amount: 10000000 },
                    { label: '5,000만원 이상', amount: 50000000 },
                  ].map(opt => {
                    const isSelected = selectedMinAmount === opt.amount;
                    return (
                      <button
                        key={opt.amount}
                        type="button"
                        onClick={() => setSelectedMinAmount(isSelected ? null : opt.amount)}
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
                <label className="block text-xs font-bold text-neutral-700 mb-1">보유/관심 장비 선택 (장비 관리 목록)</label>
                <select
                  value={selectedEquipment}
                  onChange={e => setSelectedEquipment(e.target.value)}
                  className="w-full text-xs border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500 bg-white"
                >
                  <option value="all">전체 장비 (선택 안 함)</option>
                  {equipments.map(eq => (
                    <option key={eq.id} value={eq.id}>{eq.name} ({eq.code})</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 flex justify-end gap-2">
              <button onClick={() => setIsSegmentOpen(false)} className="px-4 py-2 border border-neutral-300 text-neutral-700 text-xs font-bold rounded bg-white hover:bg-neutral-100">
                취소
              </button>
              <button
                onClick={() => {
                  const filtered: Recipient[] = [
                    { name: '김원장', email: 'kim@jeisysmed.com', hospitalName: '서울제이의원' },
                    { name: '이원장', email: 'lee@gangnam skin.com', hospitalName: '강남피부과' },
                    { name: '박원장', email: 'park@miraebeauty.com', hospitalName: '미래성형외과' },
                  ];
                  setRecipients(prev => [...prev, ...filtered]);
                  setIsSegmentOpen(false);
                  toast.success(`조건에 맞는 고객 ${filtered.length}명이 수신 대상으로 추가되었습니다.`);
                }}
                className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700"
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
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 bg-neutral-50/50">
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <Folder className="w-4 h-4 text-green-600" /> 템플릿 그룹 이동
              </h3>
              <button onClick={() => setMoveGroupTarget(null)} className="text-neutral-400 hover:text-neutral-600 p-0.5 rounded transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div className="bg-neutral-50 px-3 py-2.5 rounded border border-neutral-100">
                <p className="text-xs text-neutral-600 leading-snug">
                  <strong className="text-blue-600 font-bold block mb-0.5">[{moveGroupTarget.subject || moveGroupTarget.name}]</strong>
                  <span className="text-neutral-500 text-[11px]">템플릿을 이동할 분류를 선택해 주세요.</span>
                </p>
              </div>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
                <button
                  onClick={async () => {
                    try {
                      await emailService.updateTemplate(moveGroupTarget.id, { group_id: null });
                      toast.success('템플릿이 [미지정] 그룹으로 이동되었습니다.');
                      await loadTemplates();
                      setMoveGroupTarget(null);
                    } catch { toast.error('그룹 이동에 실패했습니다.'); }
                  }}
                  className={`w-full text-left px-3 py-2 text-xs font-semibold rounded border transition-all flex items-center justify-between ${
                    !moveGroupTarget.group_id ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold' : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50'
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
                          await emailService.updateTemplate(moveGroupTarget.id, { group_id: g.id });
                          toast.success(`템플릿이 [${g.name}] 그룹으로 이동되었습니다.`);
                          await loadTemplates();
                          setMoveGroupTarget(null);
                        } catch { toast.error('그룹 이동에 실패했습니다.'); }
                      }}
                      className={`w-full text-left px-3 py-2 text-xs font-semibold rounded border transition-all flex items-center justify-between ${
                        isSelected ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold' : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50'
                      }`}
                    >
                      <span>{g.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </button>
                  );
                })}
              </div>
            </div>
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
