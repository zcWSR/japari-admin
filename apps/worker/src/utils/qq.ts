import type { OB11GroupMessage, OB11Message } from '@/types/onebot11';

export const isGroupMessage = (message: OB11Message): message is OB11GroupMessage => {
  return message.message_type === 'group';
};
