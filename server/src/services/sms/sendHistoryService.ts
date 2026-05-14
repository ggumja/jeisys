import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * 발송 이력 저장 서비스
 */
export async function saveMtsSendHistory(data: {
    messageType: string;
    toPhoneNumber: string;
    fromPhoneNumber?: string;
    templateCode?: string;
    message?: string;
    isSuccess: boolean;
    responseCode?: string;
    errorMessage?: string;
}) {
    try {
        await prisma.mtsSendHistory.create({
            data: {
                messageType: data.messageType,
                toPhoneNumber: data.toPhoneNumber,
                fromPhoneNumber: data.fromPhoneNumber,
                templateCode: data.templateCode,
                message: data.message,
                isSuccess: data.isSuccess,
                responseCode: data.responseCode,
                errorMessage: data.errorMessage
            }
        });
    } catch (error) {
        console.error('Failed to save MTS send history:', error);
    }
}
