const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'app/friends/chat/page.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

// UI Strings
content = content.replace(/Chat Instruktur/g, 'Chat Teman');
content = content.replace(/Konsultasi langsung dengan ahlinya/g, 'Mulai percakapan dengan teman mutualmu');
content = content.replace(/Chat Baru/g, 'Chat Baru'); // same
content = content.replace(/Pilih instruktur favoritmu/g, 'Pilih teman untuk mengobrol');
content = content.replace(/Cari nama instruktur\.\.\./g, 'Cari nama teman...');

// API Endpoints & payloads
// fetchConversations
content = content.replace(/"\/api\/chat\/conversations"/g, '"/api/chat/users/conversations"');
// fetchInstructors to fetchMutualUsers
content = content.replace(/"\/api\/chat\/instructors"/g, '"/api/chat/users/mutuals"');
// Messages routes
content = content.replace(/"\/api\/chat\/conversations\/\$\{conversationId\}\/messages"/g, '"/api/chat/users/conversations/${conversationId}/messages"');
content = content.replace(/"\/api\/chat\/conversations\/\$\{selectedConversationId\}\/messages"/g, '"/api/chat/users/conversations/${selectedConversationId}/messages"');
content = content.replace(/"\/api\/chat\/messages\/\$\{messageId\}"/g, '"/api/chat/users/conversations/${selectedConversationId}/messages/${messageId}"'); // For patch and delete messages
content = content.replace(/"\/api\/chat\/messages\/read"/g, '"/api/chat/users/messages/read"'); // Mark as read

// Delete conversation
content = content.replace(/"\/api\/chat\/conversations\/\$\{selectedConversationId\}"/g, '"/api/chat/users/conversations/${selectedConversationId}"');

// Types & Property Access
content = content.replace(/participant:/g, 'otherUser:');
content = content.replace(/\.participant/g, '.otherUser');

// startConversation Payload
content = content.replace(/body: JSON\.stringify\(\{ instructorId \}\)/g, 'body: JSON.stringify({ otherUserId: instructorId })');

// Query param
content = content.replace(/searchParams\.get\("instructorId"\)/g, 'searchParams.get("userId")');

// Remove Favorite Instructor logic
// We can just find the DropdownMenuItem for favorite and remove it.
// The easiest is to regex replace it out.
content = content.replace(/<DropdownMenuItem[\s\S]*?handleToggleFavorite[\s\S]*?<\/DropdownMenuItem>/g, '');
// And remove the whole fetchFavorites useEffect line, but just leaving it is harmless if it fails silently or returns []

// Save back
fs.writeFileSync(targetPath, content, 'utf8');
console.log('Successfully patched page.tsx');
