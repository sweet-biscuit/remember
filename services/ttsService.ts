
export const speak = (text: string, lang: string = 'en-US') => {
  if (!text) return;
  
  if ('speechSynthesis' in window) {
    // Cancel any ongoing speech to avoid overlap
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.85; // Slightly slower for better clarity
    utterance.pitch = 1.0;
    
    // Some browsers need a tiny delay after cancel to speak again
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 50);
  } else {
    console.warn('Speech synthesis not supported in this browser');
  }
};
