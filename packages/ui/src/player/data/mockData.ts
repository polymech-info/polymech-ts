/**
 * Mock data for TikTok Video Player
 * Includes sample videos, users, and comments for testing
 */

import { VideoItem, CommentItem } from '../types';

// Mock video URLs - you can replace these with your Mux playback IDs
const SAMPLE_VIDEOS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'
];

const SAMPLE_COVERS = [
  'https://images.unsplash.com/photo-1611095790444-1dfa35e37b52?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1611095790790-d4c4d8d0c7c7?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1611095791146-1c5d7b1c7b1c?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1611095791234-1234567890ab?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1611095791345-abcdef123456?w=400&h=600&fit=crop'
];

const SAMPLE_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=100&h=100&fit=crop&crop=face'
];

const SAMPLE_USERNAMES = [
  'creativecoder',
  'designguru',
  'techexplorer',
  'artlover',
  'musicmaker',
  'dancequeen',
  'comedyking',
  'foodie_life',
  'travel_addict',
  'fitness_pro',
  'bookworm',
  'gamer_elite',
  'nature_lover',
  'city_explorer',
  'vintage_vibes'
];

const SAMPLE_DESCRIPTIONS = [
  'Just discovered this amazing technique! 🔥 #coding #webdev #react',
  'When you finally fix that bug that\'s been haunting you for days 😅 #programming #developer',
  'Building something cool with React and TypeScript ⚡ #frontend #typescript',
  'The satisfaction of clean code 💯 #cleancode #javascript #programming',
  'Late night coding session vibes 🌙 #coding #developer #nightowl',
  'React hooks make everything so much easier! 🪝 #react #hooks #webdev',
  'CSS animations are pure magic ✨ #css #animation #frontend',
  'Debugging: 50% coding, 50% detective work 🕵️ #debugging #programming',
  'When your code works on the first try 🎉 #coding #success #developer',
  'TypeScript saves the day again! 💪 #typescript #javascript #webdev',
  'Component reusability for the win! 🏆 #react #components #frontend',
  'The joy of solving complex algorithms 🧠 #algorithms #coding #problem-solving',
  'Responsive design is an art form 🎨 #responsive #css #webdesign',
  'API integration made simple 🔌 #api #backend #integration',
  'Performance optimization tips that actually work! ⚡ #performance #optimization'
];

const SAMPLE_MUSIC = [
  {
    id: 'music_1',
    title: 'Coding Beats',
    playUrl: 'https://example.com/music1.mp3',
    coverMedium: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop',
    authorName: 'LoFi Producer'
  },
  {
    id: 'music_2', 
    title: 'Tech Vibes',
    playUrl: 'https://example.com/music2.mp3',
    coverMedium: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&h=100&fit=crop',
    authorName: 'Electronic Artist'
  }
];

const SAMPLE_CHALLENGES = [
  { id: 'challenge_1', title: 'CodeChallenge', desc: 'Show your coding skills' },
  { id: 'challenge_2', title: 'ReactTips', desc: 'Share React development tips' },
  { id: 'challenge_3', title: 'WebDevLife', desc: 'Life as a web developer' }
];

// Generate random stats
const generateStats = () => ({
  diggCount: Math.floor(Math.random() * 100000) + 1000,
  playCount: Math.floor(Math.random() * 1000000) + 10000,
  shareCount: Math.floor(Math.random() * 10000) + 100,
  commentCount: Math.floor(Math.random() * 5000) + 50,
  collectCount: Math.floor(Math.random() * 20000) + 200
});

// Generate mock video data
export const generateMockVideos = (count: number = 20): VideoItem[] => {
  return Array.from({ length: count }, (_, index) => {
    const authorIndex = index % SAMPLE_USERNAMES.length;
    const videoIndex = index % SAMPLE_VIDEOS.length;
    const coverIndex = index % SAMPLE_COVERS.length;
    
    return {
      id: `video_${index + 1}`,
      author: {
        nickname: SAMPLE_USERNAMES[authorIndex],
        uniqueId: SAMPLE_USERNAMES[authorIndex].toLowerCase(),
        id: `user_${authorIndex + 1}`,
        secUid: `sec_${authorIndex + 1}`,
        avatarThumb: SAMPLE_AVATARS[authorIndex % SAMPLE_AVATARS.length],
        verified: Math.random() > 0.7
      },
      video: {
        width: 720,
        height: 1280,
        duration: Math.floor(Math.random() * 60) + 15, // 15-75 seconds
        ratio: '9:16',
        playAddr: SAMPLE_VIDEOS[videoIndex],
        downloadAddr: SAMPLE_VIDEOS[videoIndex],
        cover: SAMPLE_COVERS[coverIndex],
        dynamicCover: SAMPLE_COVERS[coverIndex]
      },
      stats: generateStats(),
      desc: SAMPLE_DESCRIPTIONS[index % SAMPLE_DESCRIPTIONS.length],
      createTime: Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000), // Within last week
      isPinnedItem: Math.random() > 0.9,
      music: SAMPLE_MUSIC[index % SAMPLE_MUSIC.length],
      challenges: Math.random() > 0.5 ? [SAMPLE_CHALLENGES[index % SAMPLE_CHALLENGES.length]] : [],
      effectStickers: Math.random() > 0.7 ? [{
        id: `effect_${index}`,
        name: 'Cool Effect',
        iconUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=50&h=50&fit=crop'
      }] : []
    };
  });
};

// Mock comments data
const SAMPLE_COMMENT_TEXTS = [
  'This is amazing! 🔥',
  'Love this content! Keep it up 💪',
  'So helpful, thank you!',
  'Can you make a tutorial on this?',
  'Mind blown 🤯',
  'This changed my perspective completely',
  'Incredible work! 👏',
  'I need to try this right now',
  'Best explanation I\'ve seen',
  'You\'re so talented! ✨',
  'This deserves more views',
  'Saving this for later 📌',
  'How did you learn this?',
  'Pure genius! 🧠',
  'This is exactly what I needed'
];

export const generateMockComments = (videoId: string, count: number = 10): CommentItem[] => {
  return Array.from({ length: count }, (_, index) => {
    const authorIndex = index % SAMPLE_USERNAMES.length;
    const hasReplies = Math.random() > 0.7;
    
    const comment: CommentItem = {
      cid: `comment_${videoId}_${index + 1}`,
      user: `user_${authorIndex + 1}`,
      text: SAMPLE_COMMENT_TEXTS[index % SAMPLE_COMMENT_TEXTS.length],
      createTime: Date.now() - Math.floor(Math.random() * 24 * 60 * 60 * 1000), // Within last day
      user_digged: Math.random() > 0.8,
      is_author_digged: Math.random() > 0.9,
      digg_count: Math.floor(Math.random() * 1000) + 1,
      reply_comment_total: hasReplies ? Math.floor(Math.random() * 5) + 1 : 0,
      comment_language: 'en-US'
    };

    // Add replies if needed
    if (hasReplies) {
      comment.reply_comment = Array.from({ length: comment.reply_comment_total }, (_, replyIndex) => ({
        cid: `reply_${videoId}_${index}_${replyIndex + 1}`,
        user: `user_${(replyIndex + 5) % SAMPLE_USERNAMES.length + 1}`,
        text: `@${SAMPLE_USERNAMES[authorIndex]} ${SAMPLE_COMMENT_TEXTS[(replyIndex + 5) % SAMPLE_COMMENT_TEXTS.length]}`,
        createTime: comment.createTime + (replyIndex + 1) * 60000, // Replies come after original
        user_digged: Math.random() > 0.9,
        is_author_digged: Math.random() > 0.95,
        digg_count: Math.floor(Math.random() * 100) + 1,
        reply_comment_total: 0,
        comment_language: 'en-US'
      }));
    }

    return comment;
  });
};

// Mock user data
export const generateMockUser = (userId: string) => {
  const userIndex = parseInt(userId.replace('user_', '')) - 1;
  const usernameIndex = userIndex % SAMPLE_USERNAMES.length;
  
  return {
    id: userId,
    uniqueId: SAMPLE_USERNAMES[usernameIndex].toLowerCase(),
    nickname: SAMPLE_USERNAMES[usernameIndex],
    avatarThumb: SAMPLE_AVATARS[userIndex % SAMPLE_AVATARS.length],
    verified: Math.random() > 0.7,
    followerCount: Math.floor(Math.random() * 1000000) + 1000,
    followingCount: Math.floor(Math.random() * 1000) + 50,
    heartCount: Math.floor(Math.random() * 10000000) + 100000,
    videoCount: Math.floor(Math.random() * 500) + 10
  };
};

// Export default mock data
export const MOCK_VIDEOS = generateMockVideos(50);
export const MOCK_COMMENTS = MOCK_VIDEOS.reduce((acc, video) => {
  acc[video.id] = generateMockComments(video.id);
  return acc;
}, {} as Record<string, CommentItem[]>);
