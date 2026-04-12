import React, { useState } from "react";
import { CreditCard, ShieldCheck, Info, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface CardRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (cardDetail: { cardName: string; lastFour: string; alias?: string }) => Promise<void>;
}

export function CardRegistrationModal({
  isOpen,
  onClose,
  onSuccess,
}: CardRegistrationModalProps) {
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    cardName: "",
    alias: "",
    cardNumber: "",
    expiry: "",
    cvc: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cardName || !formData.cardNumber) {
      toast.error("카드 정보를 모두 입력해주세요.");
      return;
    }

    try {
      setLoading(true);
      // Simulate PG registration delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      const lastFour = formData.cardNumber.slice(-4);
      await onSuccess({ 
        cardName: formData.cardName, 
        lastFour: lastFour,
        alias: formData.alias 
      });
      
      setIsSuccess(true);
    } catch (error) {
      console.error("Card registration error:", error);
      toast.error("카드 등록에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsSuccess(false);
    setFormData({ cardName: "", alias: "", cardNumber: "", expiry: "", cvc: "" });
    onClose();
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 16);
    setFormData({ ...formData, cardNumber: val });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none shadow-2xl transition-all">
        {isSuccess ? (
          <div className="p-12 text-center bg-white space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="mx-auto w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
              <ShieldCheck className="w-10 h-10 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">카드 등록 완료</h3>
              <p className="text-sm text-neutral-500 leading-relaxed">
                법합카드가 성공적으로 등록되었습니다.<br />
                이제 결제 시 바로 사용하실 수 있습니다.
              </p>
            </div>
            <Button
              onClick={handleClose}
              className="w-full h-12 bg-neutral-900 hover:bg-neutral-800 text-white font-bold"
            >
              확인
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader className="p-8 bg-neutral-900 text-white">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/10 rounded-lg">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <DialogTitle className="text-xl font-bold tracking-tight">법인 카드 등록</DialogTitle>
              </div>
              <DialogDescription className="text-neutral-400 text-sm leading-relaxed">
                결제에 사용할 카드 정보를 입력해주세요. <br />
                입력하신 정보는 KICC를 통해 안전하게 암호화되어 관리됩니다.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="p-8 bg-white space-y-6">
              {/* Form implementation */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cardName" className="text-xs font-bold text-neutral-500 uppercase">카드사 선택</Label>
                  <select
                    id="cardName"
                    value={formData.cardName}
                    onChange={(e) => setFormData({ ...formData, cardName: e.target.value })}
                    className="w-full h-11 px-4 border border-neutral-200 focus:ring-2 focus:ring-neutral-900 focus:outline-none text-sm transition-all"
                    required
                  >
                    <option value="">카드사를 선택하세요</option>
                    <option value="신한카드">신한카드</option>
                    <option value="국민카드">국민카드</option>
                    <option value="현대카드">현대카드</option>
                    <option value="삼성카드">삼성카드</option>
                    <option value="우리카드">우리카드</option>
                    <option value="하나카드">하나카드</option>
                    <option value="롯데카드">롯데카드</option>
                    <option value="BC카드">BC카드</option>
                    <option value="NH농협카드">NH농협카드</option>
                    <option value="카카오뱅크">카카오뱅크</option>
                    <option value="토스뱅크">토스뱅크</option>
                    <option value="케이뱅크">케이뱅크</option>
                    <option value="씨티카드">씨티카드</option>
                    <option value="우체국">우체국</option>
                    <option value="MG새마을금고">MG새마을금고</option>
                    <option value="신협">신협</option>
                    <option value="수협카드">수협카드</option>
                    <option value="KDB산업은행">KDB산업은행</option>
                    <option value="전북은행">전북은행</option>
                    <option value="광주은행">광주은행</option>
                    <option value="제주은행">제주은행</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alias" className="text-xs font-bold text-neutral-500 uppercase">카드 별칭 (선택)</Label>
                  <Input
                    id="alias"
                    placeholder="예: 주력 법인카드, 비상용"
                    value={formData.alias}
                    onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardNumber" className="text-xs font-bold text-neutral-500 uppercase">카드 번호</Label>
                  <Input
                    id="cardNumber"
                    placeholder="0000 0000 0000 0000"
                    value={formData.cardNumber.replace(/(\d{4})/g, "$1 ").trim()}
                    onChange={handleCardNumberChange}
                    className="h-11 tracking-[0.2em] font-mono"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry" className="text-xs font-bold text-neutral-500 uppercase">유효기간</Label>
                    <Input
                      id="expiry"
                      placeholder="MM / YY"
                      value={formData.expiry}
                      onChange={(e) => setFormData({ ...formData, expiry: e.target.value })}
                      className="h-11"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvc" className="text-xs font-bold text-neutral-500 uppercase">CVC 번호</Label>
                    <Input
                      id="cvc"
                      type="password"
                      placeholder="***"
                      maxLength={3}
                      value={formData.cvc}
                      onChange={(e) => setFormData({ ...formData, cvc: e.target.value })}
                      className="h-11"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                <ShieldCheck className="w-5 h-5 text-green-600 shrink-0" />
                <p className="text-[11px] text-neutral-500 leading-normal">
                  이지페이 빌링 서비스는 고객의 카드 정보를 직접 저장하지 않으며, 
                  KICC의 보안 토큰(Billing Key) 방식을 사용하여 안전하게 결제를 처리합니다.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1 h-12 font-bold text-neutral-600"
                  disabled={loading}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-12 bg-neutral-900 hover:bg-neutral-800 text-white font-bold transition-all shadow-lg"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>인증 중...</span>
                    </div>
                  ) : (
                    "카드 등록하기"
                  )}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
