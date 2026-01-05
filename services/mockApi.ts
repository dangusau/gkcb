import { Member, Business, BlogPost, Event, Conversation, Classified, User, Job, Notification, MediaItem, Message } from '../types';

// Mock Data
const MOCK_USERS: User[] = [
    { id: 1, name: "Dr. Abdullahi Musa", email: "a.musa@example.com", avatar_url: "https://picsum.photos/id/1005/200/200", role: "member" },
    { id: 2, name: "Fatima Sani", email: "f.sani@example.com", avatar_url: "https://picsum.photos/id/1011/200/200", role: "member" },
    { id: 3, name: "GKBC Admin", email: "admin@greaterkano.com", avatar_url: "https://picsum.photos/id/1025/200/200", role: "admin" },
];

export const getFeed = async (): Promise<BlogPost[]> => {
    return [
        {
            id: 1,
            title: "GKBC Annual General Meeting 2024",
            excerpt: "Join us for the biggest business gathering in Kano state. Networking, awards, and future planning.",
            image_url: "https://picsum.photos/id/20/800/600",
            author_name: "GKBC Secretariat",
            created_at: "2 hours ago",
            likes_count: 124,
            comments_count: 45,
            is_liked: false
        },
        {
            id: 2,
            title: "New Trade Policies in Northern Nigeria",
            excerpt: "An analysis of how the recent federal policies affect local businesses in the Kano metropolis.",
            image_url: "https://picsum.photos/id/24/800/600",
            author_name: "Economic Team",
            created_at: "5 hours ago",
            likes_count: 89,
            comments_count: 12,
            is_liked: true
        }
    ];
};

export const getMembers = async (): Promise<Member[]> => {
    return [
        {
            id: 1,
            user_id: 1,
            full_name: "Alh. Bashir Tofa",
            position: "CEO",
            company: "Tofa Textiles Ltd",
            category_id: 1,
            bio: "Leading textile manufacturer in West Africa.",
            verified: true,
            image_url: "https://picsum.photos/id/1005/300/300",
            is_friend: true
        },
        {
            id: 2,
            user_id: 2,
            full_name: "Hajia Zainab Ahmed",
            position: "Managing Director",
            company: "Kano Agro-Allied",
            category_id: 2,
            bio: "Expert in agricultural exports and processing.",
            verified: true,
            image_url: "https://picsum.photos/id/1011/300/300",
            is_friend: false
        },
        {
            id: 3,
            user_id: 4,
            full_name: "Engr. Yusuf Galadima",
            position: "Principal Partner",
            company: "Galadima Construct",
            category_id: 3,
            bio: "Civil engineering and infrastructure development.",
            verified: false,
            image_url: "https://picsum.photos/id/1012/300/300",
            is_friend: true
        }
    ];
};

export const getMemberProfile = async (id: number): Promise<any | null> => {
    const members = await getMembers();
    const member = members.find(m => m.id === id);
    
    if (!member) return null;

    // Construct a profile object compatible with the Profile page
    return {
        id: member.id,
        name: member.full_name,
        email: "member@example.com", // Mock
        phone: "+234 800 123 4567", // Mock
        role: "Member",
        bio: member.bio,
        avatar: member.image_url,
        is_friend: member.is_friend,
        stats: {
            friends: Math.floor(Math.random() * 500),
            posts: Math.floor(Math.random() * 50),
            businesses: Math.floor(Math.random() * 3)
        }
    };
};

export const getBusinesses = async (): Promise<Business[]> => {
    return [
        {
            id: 1,
            name: "Grand Central Hotel",
            description: "Luxury accommodation in the heart of Kano. Offering world-class suites, conference centers, and fine dining experiences.",
            address: "1 Bompai Road, Kano",
            logo_url: "https://picsum.photos/id/1031/100/100",
            cover_image_url: "https://picsum.photos/id/1031/600/300",
            category_id: 4,
            category: "Hospitality",
            rating: 4.8,
            is_verified: true,
            is_owned: false,
            email: "info@grandcentral.ng",
            phone: "+234 800 123 4567",
            website: "www.grandcentral.ng",
            operating_hours: "Always Open (24/7)",
            products_services: ["Luxury Suites", "Event Halls", "Swimming Pool", "Restaurant"],
            owner_name: "Alh. Sani Bello",
            owner_avatar: "https://picsum.photos/id/55/100/100"
        },
        {
            id: 2,
            name: "Dala Foods Nigeria",
            description: "Producers of quality beverages and tea. Committed to using locally sourced ingredients to create refreshing drinks for the Nigerian market.",
            address: "Plot 45, Challawa Industrial Estate",
            logo_url: "https://picsum.photos/id/1060/100/100",
            cover_image_url: "https://picsum.photos/id/1060/600/300",
            category_id: 1,
            category: "Manufacturing",
            rating: 4.5,
            is_verified: true,
            is_owned: true,
            email: "sales@dalafoods.com",
            phone: "+234 700 999 8888",
            website: "www.dalafoods.com",
            operating_hours: "Mon - Fri: 8:00 AM - 5:00 PM",
            products_services: ["Dala Tea", "Hibiscus Drink", "Ginger Infusion", "Wholesale Distribution"],
            owner_name: "Dr. Abdullahi Musa",
            owner_avatar: "https://picsum.photos/id/1005/200/200"
        },
        {
            id: 3,
            name: "Kano Tech Hub",
            description: "Co-working space and tech incubator. A vibrant community for developers, designers, and startups to collaborate and grow.",
            address: "Zoo Road, Kano",
            logo_url: "https://picsum.photos/id/119/100/100",
            cover_image_url: "https://picsum.photos/id/119/600/300",
            category_id: 3,
            category: "Tech",
            rating: 4.2,
            is_verified: false,
            is_owned: false,
            email: "hello@kanotech.ng",
            phone: "+234 812 345 6789",
            website: "www.kanotech.ng",
            operating_hours: "Mon - Sat: 9:00 AM - 8:00 PM",
            products_services: ["Co-working Desks", "Private Offices", "Coding Bootcamp", "Startup Incubation"],
            owner_name: "Engr. Yusuf Galadima",
            owner_avatar: "https://picsum.photos/id/1012/300/300"
        }
    ];
};

export const getBusinessPosts = async (businessId: number): Promise<BlogPost[]> => {
    // Return posts that look like they belong to a business
    return [
        {
            id: 201,
            title: "New Product Launch",
            excerpt: "We are excited to introduce our latest product line arriving this Friday!",
            image_url: `https://picsum.photos/id/${businessId + 50}/800/600`,
            author_name: "Business Admin",
            created_at: "2 days ago",
            likes_count: 45,
            comments_count: 12,
            is_liked: false
        },
        {
            id: 202,
            title: "Holiday Operating Hours",
            excerpt: "Please note our adjusted schedule for the upcoming holidays.",
            image_url: `https://picsum.photos/id/${businessId + 51}/800/600`,
            author_name: "Business Admin",
            created_at: "1 week ago",
            likes_count: 22,
            comments_count: 4,
            is_liked: true
        }
    ];
};

export const getEvents = async (): Promise<Event[]> => {
    return [
        {
            id: 1,
            title: "Kano International Trade Fair",
            description: "The premier trade exhibition in Northern Nigeria. Showcasing the best of agriculture, manufacturing, and commerce from across the region. A must-attend for investors and entrepreneurs.",
            start_time: "Nov 12, 09:00 AM",
            location: "Trade Fair Complex",
            image_url: "https://picsum.photos/id/180/600/400",
            attendees_count: 1500
        },
        {
            id: 2,
            title: "SME Digital Workshop",
            description: "Learn how to digitize your local business. This workshop covers social media marketing, digital bookkeeping, and e-commerce strategies for Kano businesses.",
            start_time: "Dec 05, 10:00 AM",
            location: "GKBC Hall",
            image_url: "https://picsum.photos/id/3/600/400",
            attendees_count: 120
        }
    ];
};

export const getEvent = async (id: number): Promise<Event | undefined> => {
    const events = await getEvents();
    return events.find(e => e.id === id);
};

export const getConversations = async (): Promise<Conversation[]> => {
    return [
        {
            id: 1,
            with_user: MOCK_USERS[0],
            last_message: "Are we still meeting for the board review?",
            last_message_at: "10:30 AM",
            unread_count: 2
        },
        {
            id: 2,
            with_user: MOCK_USERS[1],
            last_message: "Thank you for the referral!",
            last_message_at: "Yesterday",
            unread_count: 0
        }
    ];
};

export const getClassifieds = async (): Promise<Classified[]> => {
    return [
        {
            id: 1,
            title: "Industrial Generator 50KVA",
            price: "₦4,500,000",
            image_url: "https://picsum.photos/id/1/400/300",
            category: "Machinery",
            description: "Fairly used Mikano generator. Serviced regularly. 50KVA capacity, suitable for small to medium factory operations.",
            location: "Sharada Phase 1, Kano",
            seller_name: "Alh. Bashir Tofa",
            seller_avatar: "https://picsum.photos/id/1005/100/100",
            posted_at: "2 days ago",
            condition: "Used"
        },
        {
            id: 2,
            title: "Office Space for Rent",
            price: "₦800,000/yr",
            image_url: "https://picsum.photos/id/10/400/300",
            category: "Real Estate",
            description: "Modern office suite in the central business district. 24hr power supply, security, and ample parking space.",
            location: "Post Office Road, Kano",
            seller_name: "Kano Properties",
            seller_avatar: "https://picsum.photos/id/1012/100/100",
            posted_at: "5 days ago",
            condition: "New"
        },
        {
            id: 3,
            title: "Toyota Hilux 2020",
            price: "₦18,000,000",
            image_url: "https://picsum.photos/id/111/400/300",
            category: "Vehicles",
            description: "Clean title, low mileage, foreign used. Perfect for logistics and site visits.",
            location: "Bompai, Kano",
            seller_name: "Auto World",
            seller_avatar: "https://picsum.photos/id/1025/100/100",
            posted_at: "1 week ago",
            condition: "Foreign Used"
        },
        {
            id: 4,
            title: "MacBook Pro M1",
            price: "₦1,200,000",
            image_url: "https://picsum.photos/id/0/400/300",
            category: "Electronics",
            description: "16GB RAM, 512GB SSD. Space Grey. Like new condition.",
            location: "Farm Centre, Kano",
            seller_name: "Fatima Sani",
            seller_avatar: "https://picsum.photos/id/1011/100/100",
            posted_at: "1 day ago",
            condition: "Used"
        }
    ];
};

export const getClassified = async (id: number): Promise<Classified | undefined> => {
    const items = await getClassifieds();
    return items.find(i => i.id === id);
};

export const getJobs = async (): Promise<Job[]> => {
    return [
        {
            id: 1,
            title: "Accountant",
            company: "Kano Agro-Allied",
            type: "Full-time",
            location: "Nassarawa, Kano",
            salary_range: "₦150k - ₦250k",
            posted_at: "2 days ago",
            description: "We are looking for an experienced accountant...",
            logo_url: "https://picsum.photos/id/1011/100/100",
            is_owner: false
        },
        {
            id: 2,
            title: "Sales Representative",
            company: "Tofa Textiles Ltd",
            type: "Contract",
            location: "Kantin Kwari Market",
            salary_range: "Commission Based",
            posted_at: "4 hours ago",
            description: "Energetic sales rep needed for market activation...",
            logo_url: "https://picsum.photos/id/1005/100/100",
            is_owner: true
        },
        {
            id: 3,
            title: "IT Support Specialist",
            company: "Grand Central Hotel",
            type: "Part-time",
            location: "Bompai, Kano",
            salary_range: "₦80k - ₦120k",
            posted_at: "1 week ago",
            description: "Handle guest wifi and internal systems...",
            logo_url: "https://picsum.photos/id/1031/100/100",
            is_owner: false
        }
    ];
};

export const getUserPosts = async (): Promise<BlogPost[]> => {
    return [
        {
            id: 101,
            title: "Expansion to Abuja",
            excerpt: "We are thrilled to announce that Tofa Textiles is opening a new distribution center in Abuja next month!",
            image_url: "https://picsum.photos/id/192/800/600",
            author_name: "Dr. Abdullahi Musa",
            created_at: "1 day ago",
            likes_count: 56,
            comments_count: 8,
            is_liked: false
        },
         {
            id: 102,
            title: "Reflecting on 2024 Goals",
            excerpt: "It has been a challenging but rewarding year for the manufacturing sector in Kano.",
            image_url: "https://picsum.photos/id/180/800/600",
            author_name: "Dr. Abdullahi Musa",
            created_at: "4 days ago",
            likes_count: 112,
            comments_count: 23,
            is_liked: true
        }
    ];
};

export const getUserBusinesses = async (): Promise<Business[]> => {
    return [
         {
            id: 2,
            name: "Dala Foods Nigeria",
            description: "Producers of quality beverages and tea. Committed to using locally sourced ingredients to create refreshing drinks for the Nigerian market.",
            address: "Plot 45, Challawa Industrial Estate",
            logo_url: "https://picsum.photos/id/1060/100/100",
            cover_image_url: "https://picsum.photos/id/1060/600/300",
            category_id: 1,
            category: "Manufacturing",
            rating: 4.5,
            is_verified: true,
            is_owned: true,
            email: "sales@dalafoods.com",
            phone: "+234 700 999 8888",
            website: "www.dalafoods.com",
            operating_hours: "Mon - Fri: 8:00 AM - 5:00 PM",
            products_services: ["Dala Tea", "Hibiscus Drink", "Ginger Infusion", "Wholesale Distribution"],
             owner_name: "Dr. Abdullahi Musa",
            owner_avatar: "https://picsum.photos/id/1005/200/200"
        }
    ];
};

export const getNotifications = async (): Promise<Notification[]> => {
    return [
        {
            id: 1,
            type: 'message',
            actor_name: "Hajia Zainab Ahmed",
            actor_avatar: "https://picsum.photos/id/1011/200/200",
            content: "sent you a message about the agro-allied proposal.",
            time: "2 mins ago",
            is_read: false,
            reference_id: 2 // User ID of Zainab
        },
        {
            id: 2,
            type: 'like',
            actor_name: "Engr. Yusuf Galadima",
            actor_avatar: "https://picsum.photos/id/1012/300/300",
            content: "liked your post about Abuja expansion.",
            time: "1 hour ago",
            is_read: false,
            reference_id: 3 // Member ID for Yusuf for profile nav
        },
        {
            id: 3,
            type: 'comment',
            actor_name: "Fatima Sani",
            actor_avatar: "https://picsum.photos/id/1011/200/200",
            content: "commented: 'This is a great development for the north!'",
            time: "3 hours ago",
            is_read: true,
            reference_id: 2 // User ID for profile
        },
        {
            id: 4,
            type: 'system',
            actor_name: "GKBC Admin",
            actor_avatar: "https://picsum.photos/id/1025/200/200",
            content: "Your business verification is pending review.",
            time: "1 day ago",
            is_read: true
        }
    ];
};

export const getMediaItems = async (): Promise<MediaItem[]> => {
    return [
        {
            id: 1,
            title: "2024 Kano Business Summit Highlights",
            description: "Key moments from the annual summit held at the Kano Trade Center. Featuring speeches from industry leaders and government officials.",
            thumbnail_url: "https://picsum.photos/id/1015/800/600",
            type: 'video',
            duration: "15:42",
            created_at: "2 days ago",
            views: 1250,
            author_name: "GKBC Media Team",
            category: "Events"
        },
        {
            id: 2,
            title: "Factory Tour: Tofa Textiles",
            description: "An exclusive look inside one of West Africa's largest textile manufacturing plants.",
            thumbnail_url: "https://picsum.photos/id/1025/800/600",
            type: 'video',
            duration: "08:20",
            created_at: "1 week ago",
            views: 3400,
            author_name: "Industrial Watch",
            category: "Documentary"
        },
        {
            id: 3,
            title: "Inauguration Dinner Gallery",
            description: "Photos from the inauguration dinner of the new executive council members.",
            thumbnail_url: "https://picsum.photos/id/1060/800/600",
            type: 'gallery',
            photo_count: 45,
            created_at: "3 weeks ago",
            views: 890,
            author_name: "GKBC Social",
            category: "Social"
        },
        {
            id: 4,
            title: "SME Workshop: Digital Marketing",
            description: "Full recording of the digital marketing masterclass for small business owners.",
            thumbnail_url: "https://picsum.photos/id/3/800/600",
            type: 'video',
            duration: "45:00",
            created_at: "1 month ago",
            views: 5600,
            author_name: "Tech Hub",
            category: "Education"
        }
    ];
};

export const getMediaItem = async (id: number): Promise<MediaItem | undefined> => {
    const items = await getMediaItems();
    return items.find(i => i.id === id);
};

export const getChatMessages = async (userId: number): Promise<Message[]> => {
    return [
        { id: 1, text: "Salam, how are you doing today?", sender: 'them', time: "10:30 AM", type: 'text' },
        { id: 2, text: "Wa alaikum salam. I am doing well, Alhamdulillah. How about you?", sender: 'me', time: "10:32 AM", type: 'text' },
        { id: 3, text: "I'm good. Are we still on for the meeting tomorrow?", sender: 'them', time: "10:33 AM", type: 'text' },
        { id: 4, sender: 'me', time: "10:35 AM", type: 'audio', duration: "0:15" }
    ];
};

export const getUser = async (id: number): Promise<User | undefined> => {
    // Helper to find a user from MOCK_USERS or Members to populate chat header
    const members = await getMembers();
    const member = members.find(m => m.user_id === id);
    if (member) {
        return {
            id: member.user_id,
            name: member.full_name,
            email: "mock@email.com",
            avatar_url: member.image_url,
            role: "member"
        };
    }
    // Fallback to MOCK_USERS
    return MOCK_USERS.find(u => u.id === id);
};