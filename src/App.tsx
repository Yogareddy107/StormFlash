import { motion, useScroll, useTransform, AnimatePresence } from "motion/react";
import { Camera, Zap, Instagram, Twitter, Mail, Menu, X, ChevronRight, ArrowUpRight, Play, Share2, Twitter as TwitterIcon, Mail as MailIcon, Instagram as InstagramIcon, ChevronDown, Plus, Trash2, LogOut, Lock, Image as ImageIcon, Star, Quote, Settings } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { db, auth, logout } from "./firebase";
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, Timestamp, setDoc, getDoc } from "firebase/firestore";

const categories = ["Landscape", "Street", "Portrait", "Action"];

const getYoutubeEmbedUrl = (url: string) => {
  if (!url) return "";
  // If it's already an embed URL, just return it
  if (url.includes('youtube.com/embed/')) return url;
  
  let videoId = "";
  try {
    if (url.includes('youtu.be/')) {
      // Handle youtu.be/VIDEO_ID
      videoId = url.split('youtu.be/')[1].split(/[?#]/)[0];
    } else if (url.includes('youtube.com/watch')) {
      // Handle youtube.com/watch?v=VIDEO_ID
      const urlParams = new URL(url).searchParams;
      videoId = urlParams.get('v') || "";
    } else if (url.includes('youtube.com/shorts/')) {
      // Handle youtube.com/shorts/VIDEO_ID
      videoId = url.split('youtube.com/shorts/')[1].split(/[?#]/)[0];
    } else if (url.includes('youtube.com/live/')) {
      // Handle youtube.com/live/VIDEO_ID
      videoId = url.split('youtube.com/live/')[1].split(/[?#]/)[0];
    }
  } catch (e) {
    console.error("Error parsing YouTube URL:", e);
  }
  
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
};


export default function App() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedImage, setSelectedImage] = useState<any | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isScrolled, setIsScrolled] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareTargetImage, setShareTargetImage] = useState<any | null>(null);
  const [carouselIndex, setCarouselIndex] = useState<number>(-1);
  
  // Admin State
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [photos, setPhotos] = useState<any[]>([]);
  const [newPhoto, setNewPhoto] = useState({ src: "", title: "", category: "Landscape", size: "square" });
  const [isUploading, setIsUploading] = useState(false);
  const [reelUrl, setReelUrl] = useState("https://www.youtube.com/embed/dQw4w9WgXcQ"); // Default
  const [newReelUrl, setNewReelUrl] = useState("");
  
  // Dynamic Page Content
  const [aboutData, setAboutData] = useState({
    title: "THE VISION BEHIND THE LENS",
    description: "Founded by Jaswanth, our studio is dedicated to the art of high-impact visual storytelling. We believe that every frame should feel like a pulse.",
    experience: "5Y",
    stories: "50+",
    adminPin: "188199"
  });
  const [newAboutData, setNewAboutData] = useState(aboutData);
  const [isEditingAbout, setIsEditingAbout] = useState(false);

  const { scrollY, scrollYProgress } = useScroll();
  
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 200]);
  const textX = useTransform(scrollYProgress, [0, 0.5], [0, 100]);

  // Fetch Photos from Firebase
  useEffect(() => {
    const q = query(collection(db, "photos"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const photoData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPhotos(photoData);

      // Seed initial photos if empty
      if (photoData.length === 0 && isAdmin) {
        const seedPhotos = [
          { src: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=1200", title: "Yosemite Peak", category: "Landscape", size: "large" },
          { src: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&q=80&w=800", title: "City Echoes", category: "Street", size: "tall" },
          { src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=1200", title: "Timeless Gaze", category: "Portrait", size: "square" },
          { src: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=1200", title: "Concrete Flight", category: "Action", size: "large" },
          { src: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=1200", title: "Mountain Echo", category: "Landscape", size: "tall" },
          { src: "https://images.unsplash.com/photo-1531746020798-e795c5399c07?auto=format&fit=crop&q=80&w=1200", title: "Azure Vision", category: "Portrait", size: "square" },
          { src: "https://images.unsplash.com/photo-1515238152791-8216bfdf89a7?auto=format&fit=crop&q=80&w=1200", title: "Wave Rider", category: "Action", size: "large" },
          { src: "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&q=80&w=1200", title: "Neon Nights", category: "Street", size: "tall" },
        ];
        seedPhotos.forEach(p => {
          addDoc(collection(db, "photos"), { ...p, createdAt: Timestamp.now() });
        });
      }
    }, (error) => {
      console.error("Photos Snapshot Error:", error);
    });
    return () => unsubscribe();
  }, [isAdmin]);

  // Fetch Reel URL & About Data
  useEffect(() => {
    const unsubReel = onSnapshot(doc(db, "settings", "reel"), (doc) => {
      if (doc.exists()) {
        setReelUrl(doc.data().reelUrl);
        setNewReelUrl(doc.data().reelUrl);
      }
    });

    const unsubAbout = onSnapshot(doc(db, "settings", "about"), (doc) => {
      if (doc.exists()) {
        const data = doc.data() as any;
        setAboutData(prev => ({ ...prev, ...data }));
        setNewAboutData(prev => ({ ...prev, ...data }));
      }
    });

    return () => {
      unsubReel();
      unsubAbout();
    };
  }, []);

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAdmin(!!user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    return scrollY.on("change", (latest) => {
      setIsScrolled(latest > 100);
    });
  }, [scrollY]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const filteredImages = activeCategory === "All" 
    ? photos 
    : photos.filter(img => img.category === activeCategory);

  const handleAdminLogin = async () => {
    if (pin === aboutData.adminPin) {
      // Open dashboard immediately for better UX
      setShowAdminLogin(false);
      setShowAdminDashboard(true);
      setPin("");
      setPinError("");
    } else {
      setPinError(`Invalid PIN.`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 800000) { // ~800KB limit for Firestore safety
      alert("Image is too large. Please upload an image smaller than 800KB.");
      e.target.value = "";
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewPhoto({ ...newPhoto, src: reader.result as string });
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhoto.src || !newPhoto.title) {
      alert("Please select an image and enter a title.");
      return;
    }

    try {
      await addDoc(collection(db, "photos"), {
        ...newPhoto,
        createdAt: Timestamp.now()
      });
      setNewPhoto({ src: "", title: "", category: "Landscape", size: "square" });
      // Reset file input
      const fileInput = document.getElementById('photo-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (error) {
      console.error("Error adding photo:", error);
    }
  };

  const handleDeletePhoto = async (id: string) => {
    if (confirm("Are you sure you want to delete this photo?")) {
      try {
        await deleteDoc(doc(db, "photos", id));
      } catch (error) {
        console.error("Error deleting photo:", error);
      }
    }
  };

  const handleUpdateReel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReelUrl) return;
    const sanitizedUrl = getYoutubeEmbedUrl(newReelUrl);
    try {
      await setDoc(doc(db, "settings", "reel"), { reelUrl: sanitizedUrl });
      setReelUrl(sanitizedUrl);
      setNewReelUrl(sanitizedUrl);
      alert("Reel URL updated and sanitized successfully!");
    } catch (error) {
      console.error("Error updating reel:", error);
    }
  };

  const handleUpdateAbout = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, "settings", "about"), newAboutData);
      alert("Profile content updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };


  const seedGallery = async () => {
    const seedPhotos = [
      // Landscape
      { src: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=1200", title: "Yosemite Majesty", category: "Landscape", size: "large" },
      { src: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&q=80&w=1200", title: "Valley Echo", category: "Landscape", size: "tall" },
      { src: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=1200", title: "Solar Silence", category: "Landscape", size: "square" },
      { src: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&q=80&w=1200", title: "Coastal Dreams", category: "Landscape", size: "large" },
      
      // Street
      { src: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&q=80&w=1200", title: "Urban Rhapsody", category: "Street", size: "tall" },
      { src: "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&q=80&w=1200", title: "Neon Pulse", category: "Street", size: "large" },
      { src: "https://images.unsplash.com/photo-1493397212122-2b85def82820?auto=format&fit=crop&q=80&w=1200", title: "Geometric Flow", category: "Street", size: "square" },
      { src: "https://images.unsplash.com/photo-1449156003053-c3d8c5f4aa00?auto=format&fit=crop&q=80&w=1200", title: "Vintage Streets", category: "Street", size: "tall" },
      
      // Portrait
      { src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=1200", title: "Soulful Gaze", category: "Portrait", size: "square" },
      { src: "https://images.unsplash.com/photo-1531746020798-e795c5399c07?auto=format&fit=crop&q=80&w=1200", title: "Inner Light", category: "Portrait", size: "tall" },
      { src: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=1200", title: "Creative Spirit", category: "Portrait", size: "large" },
      { src: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=1200", title: "Timeless Face", category: "Portrait", size: "tall" },
      
      // Action
      { src: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=1200", title: "Gravity Defiance", category: "Action", size: "large" },
      { src: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=1200", title: "Peak Sport", category: "Action", size: "square" },
      { src: "https://images.unsplash.com/photo-1515238152791-8216bfdf89a7?auto=format&fit=crop&q=80&w=1200", title: "Ocean Flight", category: "Action", size: "tall" },
      { src: "https://images.unsplash.com/photo-1531844251246-9a1bfaae0d70?auto=format&fit=crop&q=80&w=1200", title: "Urban Agility", category: "Action", size: "large" },
    ];
    
    try {
      for (const p of seedPhotos) {
        await addDoc(collection(db, "photos"), { ...p, createdAt: Timestamp.now() });
      }
      alert("Gallery seeded successfully!");
    } catch (error) {
      console.error("Error seeding gallery:", error);
    }
  };

  const handleShare = (e: React.MouseEvent, platform: string, imgTitle: string) => {
    e.stopPropagation();
    const text = `Check out this amazing photo: ${imgTitle} by STORMFLASH`;
    const url = window.location.href;
    
    if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'mail') {
      window.location.href = `mailto:?subject=${encodeURIComponent(imgTitle)}&body=${encodeURIComponent(text + ' ' + url)}`;
    } else if (platform === 'instagram') {
      navigator.clipboard.writeText(url);
      alert("Link copied to clipboard! Share it on your Instagram story.");
    }
    setShowShareModal(false);
  };

  const openShareModal = (e: React.MouseEvent, img: any) => {
    e.stopPropagation();
    setShareTargetImage(img);
    setShowShareModal(true);
  };

  const openCarousel = (index: number) => {
    setCarouselIndex(index);
    setSelectedImage(filteredImages[index]);
  };

  const nextImage = () => {
    const nextIdx = (carouselIndex + 1) % filteredImages.length;
    setCarouselIndex(nextIdx);
    setSelectedImage(filteredImages[nextIdx]);
  };

  const prevImage = () => {
    const prevIdx = (carouselIndex - 1 + filteredImages.length) % filteredImages.length;
    setCarouselIndex(prevIdx);
    setSelectedImage(filteredImages[prevIdx]);
  };

  const validateForm = (formData: FormData) => {
    const errors: Record<string, string> = {};
    const email = formData.get('email') as string;
    const name = formData.get('name') as string;
    const message = formData.get('message') as string;

    if (!name || name.length < 2) errors.name = "Name must be at least 2 characters";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Please enter a valid email address";
    if (!message || message.length < 10) errors.message = "Message must be at least 10 characters";

    return errors;
  };

  const handleWhatsAppRedirect = (message: string) => {
    const phoneNumber = "917702931254";
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const errors = validateForm(formData);

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setFormStatus('submitting');
    
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const message = formData.get('message') as string;

    const whatsappMessage = `Hello Storm Flash! I have an enquiry:\n\nName: ${name}\nEmail: ${email}\nMessage: ${message}`;
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    handleWhatsAppRedirect(whatsappMessage);
    
    setFormStatus('success');
    setTimeout(() => setFormStatus('idle'), 5000);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-brand selection:text-black overflow-x-hidden bg-mesh">
      {/* Preloader */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
            className="fixed inset-0 z-[200] bg-[#050505] flex flex-col items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-8"
            >
              <div className="relative">
                <Zap className="w-16 h-16 text-brand fill-brand animate-pulse" />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute -inset-4 border-2 border-brand/20 border-t-brand rounded-full"
                />
              </div>
              <div className="overflow-hidden">
                <motion.h2 
                  initial={{ y: 40 }}
                  animate={{ y: 0 }}
                  className="font-display font-bold text-2xl tracking-[0.5em] uppercase"
                >
                  STORM FLASH
                </motion.h2>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Video Modal */}
      <AnimatePresence>
        {showVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-4 md:p-12"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-6xl aspect-video rounded-3xl overflow-hidden glass shadow-2xl"
            >
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowVideo(false)}
                className="absolute top-4 right-4 z-10 text-white hover:text-brand hover:bg-white/10 rounded-full"
              >
                <X className="w-8 h-8" />
              </Button>
              <iframe 
                src={getYoutubeEmbedUrl(reelUrl)}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Carousel Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 md:p-12"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative max-w-6xl w-full h-full flex flex-col items-center justify-center gap-6"
            >
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSelectedImage(null)}
                className="absolute top-0 right-0 md:-top-12 md:right-0 text-white hover:text-brand hover:bg-white/10 rounded-full z-50"
              >
                <X className="w-8 h-8" />
              </Button>

              {/* Navigation Arrows */}
              <div className="absolute inset-y-0 left-0 md:-left-20 flex items-center z-40">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={prevImage}
                  className="text-white hover:text-brand hover:bg-white/10 rounded-full w-12 h-12"
                >
                  <ChevronDown className="w-8 h-8 rotate-90" />
                </Button>
              </div>
              <div className="absolute inset-y-0 right-0 md:-right-20 flex items-center z-40">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={nextImage}
                  className="text-white hover:text-brand hover:bg-white/10 rounded-full w-12 h-12"
                >
                  <ChevronDown className="w-8 h-8 -rotate-90" />
                </Button>
              </div>
              
              <div className="w-full h-full flex flex-col items-center justify-center">
                <div className="relative w-full max-h-[70vh] overflow-hidden rounded-3xl glass shadow-2xl flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    <motion.img 
                      key={selectedImage.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      src={selectedImage.src} 
                      alt={selectedImage.title}
                      className="max-w-full max-h-[70vh] object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </AnimatePresence>
                </div>

                <div className="text-center mt-8">
                  <span className="text-brand text-xs font-bold tracking-[0.4em] uppercase mb-2 block">{selectedImage.category}</span>
                  <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tighter mb-6">{selectedImage.title}</h2>
                  <div className="flex items-center justify-center gap-4">
                    <Button 
                      variant="outline" 
                      className="rounded-full border-white/10 hover:border-brand hover:text-brand"
                      onClick={(e) => openShareModal(e, selectedImage)}
                    >
                      <Share2 className="w-4 h-4 mr-2" /> Share Photo
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Integrated Share Modal */}
      <AnimatePresence>
        {showShareModal && shareTargetImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowShareModal(false)}
            className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm glass p-8 rounded-[32px] border border-white/10 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-display font-bold tracking-tight">Share Story</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowShareModal(false)} className="rounded-full">
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <Button 
                  variant="outline" 
                  className="w-full justify-start rounded-2xl border-white/5 bg-white/5 hover:bg-brand hover:text-black transition-all py-6"
                  onClick={(e) => handleShare(e, 'twitter', shareTargetImage.title)}
                >
                  <TwitterIcon className="w-5 h-5 mr-4" /> Share on Twitter
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start rounded-2xl border-white/5 bg-white/5 hover:bg-brand hover:text-black transition-all py-6"
                  onClick={(e) => handleShare(e, 'instagram', shareTargetImage.title)}
                >
                  <InstagramIcon className="w-5 h-5 mr-4" /> Copy Instagram Link
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start rounded-2xl border-white/5 bg-white/5 hover:bg-brand hover:text-black transition-all py-6"
                  onClick={(e) => handleShare(e, 'mail', shareTargetImage.title)}
                >
                  <MailIcon className="w-5 h-5 mr-4" /> Send via Email
                </Button>
              </div>
              
              <p className="text-center text-[10px] font-bold tracking-widest uppercase text-white/20 mt-8">
                Storm Flash | Visual Narratives
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Header */}
      <header 
        className={`fixed left-1/2 -translate-x-1/2 z-50 transition-all duration-700 ease-[0.22,1,0.36,1] ${
          isScrolled 
            ? "top-6 w-[calc(100%-3rem)] max-w-5xl" 
            : "top-0 w-full max-w-none"
        }`}
      >
        <nav 
          className={`transition-all duration-700 ease-[0.22,1,0.36,1] flex items-center justify-between px-6 md:px-12 py-4 ${
            isScrolled 
              ? "glass rounded-full shadow-2xl mx-auto" 
              : "bg-transparent border-b border-white/5"
          }`}
        >
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 group cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <Zap className="w-6 h-6 text-brand fill-brand" />
            <span className="font-display font-bold text-xl tracking-tighter">
              Storm <span className="font-serif italic font-light">Flash</span>
            </span>
          </motion.div>

          <div className="hidden md:flex items-center gap-8">
            {["Gallery", "About", "Contact"].map((item) => (
              <a 
                key={item} 
                href={`#${item.toLowerCase()}`}
                className="text-xs font-semibold text-white/50 hover:text-brand transition-colors uppercase tracking-[0.2em]"
              >
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Button 
              size="sm" 
              className="hidden md:flex rounded-full bg-brand text-black font-bold hover:bg-white transition-all px-6"
              onClick={() => handleWhatsAppRedirect("Hello Storm Flash! I would like to book a photography session.")}
            >
              Book Now
            </Button>
            
            {/* Mobile Menu Trigger */}
            <Sheet>
              <SheetTrigger render={
                <Button variant="ghost" size="icon" className="md:hidden text-white">
                  <Menu className="w-6 h-6" />
                </Button>
              } />
              <SheetContent side="right" className="bg-[#050505] border-white/10 text-white">
                <div className="flex flex-col items-center justify-center h-full gap-8">
                  {["Gallery", "About", "Contact"].map((item) => (
                    <a 
                      key={item} 
                      href={`#${item.toLowerCase()}`}
                      className="text-2xl font-display font-bold hover:text-brand transition-colors"
                    >
                      {item}
                    </a>
                  ))}
                  <Button 
                    className="rounded-full bg-brand text-black font-bold mt-4"
                    onClick={() => handleWhatsAppRedirect("Hello Storm Flash! I would like to book a photography session.")}
                  >
                    Book Now
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </header>

      <main>
        {/* Editorial Hero */}
        <section className="relative h-screen flex items-center justify-center overflow-hidden">
          <motion.div 
            style={{ opacity: heroOpacity, scale: heroScale }}
            className="relative z-20 w-full max-w-7xl mx-auto px-6 pt-20"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
              <div className="lg:col-span-8">
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span className="inline-block text-brand font-display font-bold tracking-[0.4em] uppercase mb-6 text-xs">
                    Jaswanth | 5Y Experience
                  </span>
                  <h1 className="text-[12vw] lg:text-[10vw] font-display font-black tracking-tighter leading-[0.85] mb-8">
                    STORM <br />
                    <span className="font-serif italic font-light text-white/20">FLASH</span>
                  </h1>
                </motion.div>
              </div>
              
              <div className="lg:col-span-4 pb-8">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 1 }}
                  className="space-y-8 border-l border-white/10 pl-8"
                >
                  <p className="text-white/40 text-lg font-light leading-relaxed">
                    TIRUPATI based photographer capturing raw energy with Sony Alpha M4. 50+ Stories Told through high-contrast narratives.
                  </p>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowVideo(true)}
                    className="flex items-center gap-4 group cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-full glass flex items-center justify-center group-hover:bg-brand group-hover:text-black transition-all duration-500">
                      <Play className="w-5 h-5 fill-current" />
                    </div>
                    <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/60 group-hover:text-brand transition-colors">
                      Watch Reel
                    </span>
                  </motion.button>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Immersive Background - Advanced Animated Black Theme */}
          <div className="absolute inset-0 z-0 bg-black overflow-hidden">
            {/* Photography Theme Image Layer */}
            <motion.div
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ 
                scale: [1.1, 1.2, 1.1],
                opacity: 0.35
              }}
              transition={{ 
                scale: { duration: 30, repeat: Infinity, ease: "linear" },
                opacity: { duration: 2 }
              }}
              className="absolute inset-0 z-0"
            >
              <img 
                src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=2000" 
                alt="Cinematic Camera Lens"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </motion.div>

            {/* Animated Grid */}
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `linear-gradient(to right, #1a1a1a 1px, transparent 1px), linear-gradient(to bottom, #1a1a1a 1px, transparent 1px)`,
                backgroundSize: '40px 40px',
                maskImage: 'radial-gradient(circle at 50% 50%, black, transparent 80%)'
              }}
            />
            
            {/* Moving Glows */}
            <motion.div 
              animate={{ 
                x: [0, 100, 0],
                y: [0, 50, 0],
                opacity: [0.1, 0.3, 0.1]
              }}
              transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand/20 rounded-full blur-[120px]"
            />
            <motion.div 
              animate={{ 
                x: [0, -100, 0],
                y: [0, -50, 0],
                opacity: [0.1, 0.2, 0.1]
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-white/5 rounded-full blur-[150px]"
            />

            {/* Floating Particles */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: Math.random() * 2000 - 1000, 
                  y: Math.random() * 2000 - 1000,
                  opacity: Math.random() * 0.5
                }}
                animate={{ 
                  y: [null, Math.random() * -200 - 100],
                  opacity: [null, 0]
                }}
                transition={{ 
                  duration: Math.random() * 10 + 10, 
                  repeat: Infinity, 
                  ease: "linear",
                  delay: Math.random() * 10
                }}
                className="absolute w-1 h-1 bg-white rounded-full"
              />
            ))}

            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-[#050505] z-10" />
            
            {/* Subtle Noise Texture */}
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
          </div>

          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-4">
            <ChevronDown className="w-6 h-6 text-brand animate-bounce" />
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/30">Scroll</span>
          </div>
        </section>

        {/* Premium Services */}
        <section id="services" className="py-40 bg-white/5 border-y border-white/5">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-24">
              <span className="text-brand font-display font-bold tracking-[0.4em] uppercase text-xs mb-4 block">What We Offer</span>
              <h2 className="text-5xl lg:text-7xl font-display font-bold tracking-tighter">PREMIUM <span className="font-serif italic font-light text-white/30">SERVICES</span></h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { title: "Weddings", desc: "Cinematic, high-contrast coverage of your most momentous day.", icon: <Zap className="w-8 h-8 text-brand" /> },
                { title: "Portraits", desc: "Editorial style character studies that capture the soul.", icon: <Star className="w-8 h-8 text-brand" /> },
                { title: "Street", desc: "Raw, energetic urban narratives captured in the moment.", icon: <Camera className="w-8 h-8 text-brand" /> },
                { title: "Commercial", desc: "Elevating brands through state-of-the-art visual language.", icon: <Settings className="w-8 h-8 text-brand" /> }
              ].map((service, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ y: -10 }}
                  className="glass p-10 rounded-[32px] border border-white/10 hover:border-brand/40 transition-all group"
                >
                  <div className="mb-8 p-4 bg-white/5 rounded-2xl w-fit group-hover:bg-brand group-hover:text-black transition-all">
                    {service.icon}
                  </div>
                  <h3 className="text-2xl font-display font-bold mb-4">{service.title}</h3>
                  <p className="text-white/40 leading-relaxed text-sm">{service.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Bento Gallery */}
        <section id="gallery" className="py-40 px-6 max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-24 gap-12">
            <div className="max-w-2xl">
              <h2 className="text-5xl lg:text-7xl font-display font-bold mb-8 tracking-tighter">
                THE <span className="font-serif italic font-light">COLLECTION</span>
              </h2>
              <div className="flex flex-wrap gap-3">
                {["All", "Landscape", "Street", "Portrait", "Action"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-6 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all duration-500 border ${
                      activeCategory === cat 
                        ? "bg-brand border-brand text-black" 
                        : "border-white/10 text-white/40 hover:border-white/30"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div className="hidden lg:block text-right">
              <span className="text-brand font-display font-bold text-6xl">01</span>
              <p className="text-[10px] font-bold tracking-widest uppercase text-white/20 mt-2">Selected Works</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 auto-rows-[300px]">
            <AnimatePresence mode="popLayout">
              {filteredImages.map((img, idx) => (
                <motion.div
                  layout
                  key={img.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: idx * 0.05 }}
                  onClick={() => openCarousel(idx)}
                  className={`relative group overflow-hidden rounded-3xl glass cursor-zoom-in ${
                    img.size === "large" ? "lg:col-span-8 lg:row-span-2" : 
                    img.size === "tall" ? "lg:col-span-4 lg:row-span-2" : 
                    img.size === "square" ? "lg:col-span-4 lg:row-span-1" : 
                    "lg:col-span-4 lg:row-span-1"
                  }`}
                >
                  <img 
                    src={img.src} 
                    alt={img.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-60 group-hover:opacity-100"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-10">
                    <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-brand text-[10px] font-bold tracking-[0.3em] uppercase">{img.category}</span>
                        <div className="flex gap-3">
                          <button 
                            onClick={(e) => openShareModal(e, img)}
                            className="p-2 rounded-full bg-white/10 hover:bg-brand hover:text-black transition-colors"
                          >
                            <Share2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <h3 className="text-3xl font-display font-bold tracking-tighter mb-4">{img.title}</h3>
                      <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-white/40">
                        Click to expand <ArrowUpRight className="w-3 h-3" />
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Lift Effect Overlay (Visual only) */}
                  <motion.div 
                    whileHover={{ 
                      opacity: 1,
                      scale: 1.05,
                      boxShadow: "0 30px 60px -12px rgba(0, 242, 255, 0.4)"
                    }}
                    className="absolute inset-0 pointer-events-none border border-brand/0 group-hover:border-brand/30 rounded-3xl transition-all duration-500"
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>

        {/* Stylish About */}
        <section id="about" className="py-40 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div className="relative">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative z-10 rounded-[40px] overflow-hidden glass p-4"
              >
                <img 
                  src="https://images.unsplash.com/photo-1554048612-b6a482bc67e5?auto=format&fit=crop&q=80&w=1000" 
                  alt="Jaswanth"
                  className="w-full aspect-[4/5] object-cover rounded-[32px] grayscale hover:grayscale-0 transition-all duration-1000"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
              <div className="absolute -top-12 -left-12 w-48 h-48 bg-brand/10 blur-[100px] rounded-full" />
              <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-white/5 blur-[100px] rounded-full" />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-5xl lg:text-7xl font-display font-bold mb-12 tracking-tighter leading-[0.9]">
                {aboutData.title.split(' ')[0]} <span className="font-serif italic font-light text-white/30">{aboutData.title.split(' ').slice(1).join(' ')}</span>
              </h2>
              <div className="space-y-8 text-white/50 text-xl font-light leading-relaxed">
                <p>
                  {aboutData.description}
                </p>
                <div className="grid grid-cols-2 gap-12 pt-8">
                  <div>
                    <span className="block text-brand font-display font-bold text-5xl mb-2">{aboutData.experience}</span>
                    <span className="text-[10px] font-bold tracking-widest uppercase text-white/20">Experience</span>
                  </div>
                  <div>
                    <span className="block text-brand font-display font-bold text-5xl mb-2">{aboutData.stories}</span>
                    <span className="text-[10px] font-bold tracking-widest uppercase text-white/20">Stories Told</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Cinematic Testimonials */}
        <section className="py-40 border-b border-white/5 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 mb-24">
            <h2 className="text-4xl lg:text-6xl font-display font-bold tracking-tighter text-center">CLIENT <span className="font-serif italic font-light text-white/30">LOVE</span></h2>
          </div>
          
          <div className="flex flex-col gap-12">
            {/* Infinite Marquee 1 */}
            <div className="flex gap-8 whitespace-nowrap animate-marquee">
              {[1, 2, 3, 4, 5].map((_, i) => (
                <div key={i} className="inline-flex flex-col gap-6 glass p-10 rounded-[40px] border border-white/5 min-w-[400px]">
                  <Quote className="w-8 h-8 text-brand/20" />
                  <p className="text-xl font-light italic text-white/80 whitespace-normal">
                    "Storm Flash captured our wedding with a level of artistry we didn't think was possible. Truly world-class."
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-brand/20" />
                    <div>
                      <h4 className="font-bold text-sm">Rahul S.</h4>
                      <p className="text-[10px] uppercase tracking-widest text-brand">Wedding Client</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Infinite Marquee 2 */}
            <div className="flex gap-8 whitespace-nowrap animate-marquee-reverse">
              {[1, 2, 3, 4, 5].map((_, i) => (
                <div key={i} className="inline-flex flex-col gap-6 glass p-10 rounded-[40px] border border-white/5 min-w-[400px]">
                  <Quote className="w-8 h-8 text-brand/20" />
                  <p className="text-xl font-light italic text-white/80 whitespace-normal">
                    "The portrait session was incredible. Jaswanth knows exactly how to work with light to create a mood."
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-brand/20" />
                    <div>
                      <h4 className="font-bold text-sm">Ananya K.</h4>
                      <p className="text-[10px] uppercase tracking-widest text-brand">Fashion Model</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* Contact Section */}
        <section id="contact" className="py-40 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-5xl lg:text-7xl font-display font-bold mb-8 tracking-tighter">
              START A <span className="font-serif italic font-light">PROJECT</span>
            </h2>
            <p className="text-white/40 text-lg mb-16">
              Ready to capture something legendary?
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-6 text-left">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <input 
                    name="name"
                    type="text" 
                    placeholder="Your Name" 
                    className={`w-full bg-white/5 border ${formErrors.name ? 'border-red-500' : 'border-white/10'} rounded-2xl px-6 py-4 focus:border-brand outline-none transition-colors`}
                  />
                  {formErrors.name && <p className="text-red-500 text-xs ml-2">{formErrors.name}</p>}
                </div>
                <div className="space-y-2">
                  <input 
                    name="email"
                    type="email" 
                    placeholder="Email Address" 
                    className={`w-full bg-white/5 border ${formErrors.email ? 'border-red-500' : 'border-white/10'} rounded-2xl px-6 py-4 focus:border-brand outline-none transition-colors`}
                  />
                  {formErrors.email && <p className="text-red-500 text-xs ml-2">{formErrors.email}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <textarea 
                  name="message"
                  placeholder="Tell us about your vision..." 
                  rows={6} 
                  className={`w-full bg-white/5 border ${formErrors.message ? 'border-red-500' : 'border-white/10'} rounded-2xl px-6 py-4 focus:border-brand outline-none transition-colors resize-none`}
                />
                {formErrors.message && <p className="text-red-500 text-xs ml-2">{formErrors.message}</p>}
              </div>
              
              <Button 
                type="submit"
                disabled={formStatus === 'submitting'}
                className="w-full rounded-2xl bg-brand text-black font-bold py-8 text-lg hover:bg-white transition-all disabled:opacity-50"
              >
                {formStatus === 'submitting' ? 'Sending...' : formStatus === 'success' ? 'Message Sent!' : 'Send Message'}
              </Button>

              {formStatus === 'success' && (
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-brand text-center font-bold"
                >
                  Thank you! We'll get back to you within 24 hours.
                </motion.p>
              )}
            </form>
          </div>
        </section>
      </main>

      <footer className="py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-brand fill-brand" />
              <span className="font-display font-bold text-xl tracking-tighter">
                Storm <span className="font-serif italic font-light">Flash</span>
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 md:gap-12 text-[10px] font-bold tracking-widest uppercase text-white/20">
            <a href="https://www.instagram.com/stormflash__/" target="_blank" rel="noopener noreferrer" className="hover:text-brand transition-colors text-center">Instagram</a>
            <a href="https://wa.me/917702931254" target="_blank" rel="noopener noreferrer" className="hover:text-brand transition-colors text-center">WhatsApp</a>
            <a href="mailto:stormflash78@gmail.com" className="hover:text-brand transition-colors text-center">stormflash78@gmail.com</a>
            <button 
              onClick={() => isAdmin ? setShowAdminDashboard(true) : setShowAdminLogin(true)}
              className="hover:text-brand transition-colors uppercase flex items-center gap-1"
              title="Admin Portal"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-col items-center md:items-end gap-2 text-center md:text-right">
            <p className="text-[10px] font-bold tracking-widest uppercase text-white/10">
              © 2026 STORM FLASH. ALL RIGHTS RESERVED.
            </p>
            <a 
              href="https://intraspherelabs.vercel.app/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[8px] font-bold tracking-[0.2em] uppercase text-white/5 hover:text-brand transition-colors"
            >
              built by Intrasphere Labs
            </a>
          </div>
        </div>
      </footer>

      {/* Admin Login Modal */}
      <AnimatePresence>
        {showAdminLogin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-xl p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md glass p-12 rounded-3xl border border-white/10"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-display font-bold">Admin Portal</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowAdminLogin(false)}>
                  <X className="w-6 h-6" />
                </Button>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold tracking-widest uppercase text-white/40">Enter PIN</label>
                  <input
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:border-brand outline-none text-center text-2xl tracking-[0.5em]"
                  />
                  {pinError && <p className="text-red-500 text-xs text-center">{pinError}</p>}
                </div>
                <Button 
                  onClick={handleAdminLogin}
                  className="w-full rounded-2xl bg-brand text-black font-bold py-6"
                >
                  Unlock Dashboard
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Dashboard Modal */}
      <AnimatePresence>
        {showAdminDashboard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-[#050505] overflow-y-auto"
          >
            <div className="max-w-7xl mx-auto px-6 py-12">
              <div className="flex justify-between items-center mb-12">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-brand flex items-center justify-center text-black">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-display font-bold">Admin Dashboard</h2>
                    <p className="text-white/40 text-xs uppercase tracking-widest">Manage Gallery Content</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Button variant="ghost" onClick={() => setShowAdminDashboard(false)}>Close</Button>
                  <Button variant="destructive" onClick={() => { logout(); setShowAdminDashboard(false); }} className="gap-2">
                    <LogOut className="w-4 h-4" /> Logout
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Add Photo Form */}
                <div className="lg:col-span-1 space-y-8">
                  <div className="glass p-8 rounded-3xl border border-white/10">
                    <h3 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
                      <Play className="w-5 h-5 text-brand" /> Manage Hero Reel
                    </h3>
                    <form onSubmit={handleUpdateReel} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold tracking-widest uppercase text-white/40">Embed URL (YouTube/Vimeo)</label>
                        <input
                          type="text"
                          value={newReelUrl}
                          onChange={(e) => setNewReelUrl(e.target.value)}
                          placeholder="https://www.youtube.com/embed/..."
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-brand outline-none text-sm"
                        />
                      </div>
                      <Button type="submit" className="w-full rounded-xl bg-white text-black font-bold py-4">
                        Update Reel
                      </Button>
                    </form>
                  </div>

                  <div className="glass p-8 rounded-3xl border border-white/10">
                    <h3 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
                      <Settings className="w-5 h-5 text-brand" /> Global Settings
                    </h3>
                    <form onSubmit={handleUpdateAbout} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold tracking-widest uppercase text-white/40">Professional Title</label>
                        <input
                          type="text"
                          value={newAboutData.title}
                          onChange={(e) => setNewAboutData({...newAboutData, title: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-brand outline-none text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold tracking-widest uppercase text-white/40">About Description</label>
                        <textarea
                          value={newAboutData.description}
                          onChange={(e) => setNewAboutData({...newAboutData, description: e.target.value})}
                          rows={4}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-brand outline-none text-sm resize-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold tracking-widest uppercase text-white/40">Exp (e.g. 5Y)</label>
                          <input
                            type="text"
                            value={newAboutData.experience}
                            onChange={(e) => setNewAboutData({...newAboutData, experience: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-brand outline-none text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold tracking-widest uppercase text-white/40">Stories (e.g. 50+)</label>
                          <input
                            type="text"
                            value={newAboutData.stories}
                            onChange={(e) => setNewAboutData({...newAboutData, stories: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-brand outline-none text-sm"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold tracking-widest uppercase text-white/40">Admin Dashboard PIN</label>
                        <input
                          type="text"
                          value={newAboutData.adminPin}
                          onChange={(e) => setNewAboutData({...newAboutData, adminPin: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-brand outline-none text-sm"
                        />
                      </div>
                      <Button type="submit" className="w-full rounded-xl bg-white text-black font-bold py-4">
                        Update Site Content
                      </Button>
                    </form>
                  </div>

                  <div className="glass p-8 rounded-3xl border border-white/10 sticky top-12">
                    <h3 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
                      <Plus className="w-5 h-5 text-brand" /> Add New Photo
                    </h3>
                    <form onSubmit={handleAddPhoto} className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold tracking-widest uppercase text-white/40">Upload Image</label>
                        <div className="relative">
                          <input
                            id="photo-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                          <label 
                            htmlFor="photo-upload"
                            className="flex flex-col items-center justify-center w-full h-32 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:border-brand transition-all overflow-hidden"
                          >
                            {newPhoto.src ? (
                              <img src={newPhoto.src} className="w-full h-full object-cover" alt="Preview" />
                            ) : (
                              <div className="flex flex-col items-center gap-2">
                                <Plus className="w-6 h-6 text-white/20" />
                                <span className="text-[10px] font-bold tracking-widest uppercase text-white/20">
                                  {isUploading ? "Processing..." : "Choose File"}
                                </span>
                              </div>
                            )}
                          </label>
                        </div>
                        <p className="text-[8px] text-white/20 uppercase tracking-widest text-center">Max size: 800KB</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold tracking-widest uppercase text-white/40">Title</label>
                        <input
                          type="text"
                          value={newPhoto.title}
                          onChange={(e) => setNewPhoto({...newPhoto, title: e.target.value})}
                          placeholder="Photo Title"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-brand outline-none text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold tracking-widest uppercase text-white/40">Category</label>
                          <select
                            value={newPhoto.category}
                            onChange={(e) => setNewPhoto({...newPhoto, category: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-brand outline-none text-sm appearance-none"
                          >
                            {categories.map(cat => <option key={cat} value={cat} className="bg-[#050505]">{cat}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold tracking-widest uppercase text-white/40">Grid Size</label>
                          <select
                            value={newPhoto.size}
                            onChange={(e) => setNewPhoto({...newPhoto, size: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-brand outline-none text-sm appearance-none"
                          >
                            <option value="square" className="bg-[#050505]">Square</option>
                            <option value="tall" className="bg-[#050505]">Tall</option>
                            <option value="large" className="bg-[#050505]">Large</option>
                          </select>
                        </div>
                      </div>
                    <div className="flex flex-col gap-4 mt-8">
                      <Button type="submit" className="w-full rounded-xl bg-brand text-black font-bold py-6">
                        Upload to Gallery
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={seedGallery}
                        className="w-full rounded-xl border-white/10 hover:bg-white/5 text-white/60 text-xs"
                      >
                        Seed Example Collection
                      </Button>
                    </div>
                    </form>
                  </div>
                </div>

                {/* Photo Management List */}
                <div className="lg:col-span-2">
                  <div className="glass p-8 rounded-3xl border border-white/10">
                    <h3 className="text-xl font-display font-bold mb-8 flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-brand" /> Current Gallery ({photos.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {photos.map((photo) => (
                        <div key={photo.id} className="relative group rounded-2xl overflow-hidden border border-white/5 bg-white/5">
                          <div className="aspect-video">
                            <img src={photo.src} alt={photo.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <div className="p-4 flex justify-between items-center">
                            <div>
                              <h4 className="font-bold text-sm">{photo.title}</h4>
                              <p className="text-[10px] text-white/40 uppercase tracking-widest">{photo.category} • {photo.size}</p>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDeletePhoto(photo.id)}
                              className="text-white/20 hover:text-red-500 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
