const fs = require('fs');
const path = require('path');

const replacements = {
  'prisma.user.': 'prisma.users.',
  'prisma.schedule.': 'prisma.schedules.',
  'prisma.competition.': 'prisma.competitions.',
  'prisma.activityLog.': 'prisma.activity_logs.',
  'prisma.chatConversation.': 'prisma.chat_conversations.',
  'prisma.chatMessage.': 'prisma.chat_messages.',
  'prisma.forumMessage.': 'prisma.forum_messages.',
  'prisma.badge.': 'prisma.badges.',
  'prisma.userBadge.': 'prisma.user_badges.',
  'prisma.friendship.': 'prisma.friendships.',
  'prisma.notification.': 'prisma.notifications.',
  'prisma.program_enrollment.': 'prisma.program_enrollments.',
  'prisma.material_quiz.': 'prisma.material_quizzes.',
  'prisma.quiz_question.': 'prisma.quiz_questions.',
  'prisma.quiz_attempt.': 'prisma.quiz_attempts.',
  'prisma.savedNews.': 'prisma.saved_news.',
  'prisma.favoriteInstructor.': 'prisma.favorite_instructors.',
  'prisma.program.': 'prisma.programs.',
  'prisma.account.': 'prisma.accounts.',
  'NotificationType': 'notifications_type',
  'ActivityType': 'activity_logs_type'
};

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(file => {
    const dirPath = path.join(dir, file);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      if (!dirPath.includes('node_modules') && !dirPath.includes('.next') && !dirPath.includes('.git')) {
        walk(dirPath, callback);
      }
    } else {
      if (dirPath.endsWith('.ts') || dirPath.endsWith('.tsx')) {
        callback(dirPath);
      }
    }
  });
}

const targetDirs = ['./app', './lib', './scripts'];

targetDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    walk(dir, filePath => {
      let content = fs.readFileSync(filePath, 'utf8');
      let changed = false;
      for (const [search, replace] of Object.entries(replacements)) {
        if (content.includes(search)) {
          // split and join to replace all
          content = content.split(search).join(replace);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
      }
    });
  }
});
console.log('Done.');
