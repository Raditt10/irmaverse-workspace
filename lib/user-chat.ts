import prisma from "@/lib/prisma";

export async function ensureUserChatTables() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS user_chat_conversations (
      id VARCHAR(191) NOT NULL,
      user1Id VARCHAR(191) NOT NULL,
      user2Id VARCHAR(191) NOT NULL,
      createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY user_chat_conversations_user1_user2_unique (user1Id, user2Id),
      INDEX user_chat_conversations_user1_idx (user1Id),
      INDEX user_chat_conversations_user2_idx (user2Id),
      CONSTRAINT user_chat_conversations_user1_fkey
        FOREIGN KEY (user1Id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT user_chat_conversations_user2_fkey
        FOREIGN KEY (user2Id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS user_chat_messages (
      id VARCHAR(191) NOT NULL,
      conversationId VARCHAR(191) NOT NULL,
      senderId VARCHAR(191) NOT NULL,
      content TEXT NOT NULL,
      isRead BOOLEAN NOT NULL DEFAULT false,
      readAt DATETIME(3) NULL,
      attachmentUrl VARCHAR(500) NULL,
      attachmentType VARCHAR(191) NULL,
      isEdited BOOLEAN NOT NULL DEFAULT false,
      editedAt DATETIME(3) NULL,
      isDeleted BOOLEAN NOT NULL DEFAULT false,
      deletedAt DATETIME(3) NULL,
      createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      INDEX user_chat_messages_conversation_idx (conversationId),
      INDEX user_chat_messages_sender_idx (senderId),
      CONSTRAINT user_chat_messages_conversation_fkey
        FOREIGN KEY (conversationId) REFERENCES user_chat_conversations(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT user_chat_messages_sender_fkey
        FOREIGN KEY (senderId) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

export function normalizeUserPair(userA: string, userB: string) {
  return userA < userB
    ? { user1Id: userA, user2Id: userB }
    : { user1Id: userB, user2Id: userA };
}

export async function hasMutualFollow(userId: string, otherUserId: string) {
  const [a, b] = await Promise.all([
    prisma.friendships.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: otherUserId,
        },
      },
      select: { status: true },
    }),
    prisma.friendships.findUnique({
      where: {
        followerId_followingId: {
          followerId: otherUserId,
          followingId: userId,
        },
      },
      select: { status: true },
    }),
  ]);

  return a?.status === "accepted" && b?.status === "accepted";
}
