import React, { 
  useState, 
  useEffect, 
  useRef, 
  createContext, 
  useContext, 
  useCallback,
  useImperativeHandle,
  forwardRef
} from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// Touch/Swipe interface definitions
interface TouchPosition {
  x: number;
  y: number;
  time: number;
}

interface SwipeState {
  isDragging: boolean;
  startPos: TouchPosition | null;
  currentPos: TouchPosition | null;
  velocity: number;
  direction: 'left' | 'right' | 'up' | 'down' | null;
}

// Embla-like API
export interface CarouselApi {
  scrollPrev: () => void;
  scrollNext: () => void;
  scrollTo: (index: number, jump?: boolean) => void;
  selectedScrollSnap: () => number;
  scrollSnapList: () => number[];
  on: (event: string, callback: () => void) => void;
  off: (event: string, callback: () => void) => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
  internal_index: number;
  internal_itemCount: number;
  internal_state: () => { selectedIndex: number; itemCount: number };
}

const CarouselContext = createContext<{
  api: CarouselApi | null;
  carouselRef: React.RefObject<HTMLDivElement>;
  carouselContentRef: React.RefObject<HTMLDivElement>;
  orientation: "horizontal" | "vertical";
  opts: CarouselProps["opts"];
  swipeState: SwipeState;
} | null>(null);

interface CarouselProps {
  children: React.ReactNode;
  className?: string;
  opts?: {
    align?: "start" | "center" | "end";
    loop?: boolean;
    skipSnaps?: boolean;
    dragFree?: boolean;
    containScroll?: "" | "trimSnaps" | "keepSnaps";
    swipeThreshold?: number; // Minimum distance for swipe detection
    velocityThreshold?: number; // Minimum velocity for momentum scrolling
  };
  orientation?: "horizontal" | "vertical";
  setApi?: (api: CarouselApi) => void;
}

interface CarouselContentProps {
  children: React.ReactNode;
  className?: string;
}

interface CarouselItemProps {
  children: React.ReactNode;
  className?: string;
}

// Touch utility functions
const getTouchPosition = (event: TouchEvent | MouseEvent): TouchPosition => {
  const touch = 'touches' in event ? event.touches[0] : event;
  return {
    x: touch.clientX,
    y: touch.clientY,
    time: Date.now()
  };
};

const calculateVelocity = (start: TouchPosition, end: TouchPosition): number => {
  const distance = Math.sqrt(
    Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
  );
  const time = end.time - start.time;
  return time > 0 ? distance / time : 0;
};

const getSwipeDirection = (start: TouchPosition, end: TouchPosition, orientation: "horizontal" | "vertical") => {
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  
  if (orientation === "horizontal") {
    return Math.abs(deltaX) > Math.abs(deltaY) 
      ? (deltaX > 0 ? 'right' : 'left')
      : null;
  } else {
    return Math.abs(deltaY) > Math.abs(deltaX)
      ? (deltaY > 0 ? 'down' : 'up')
      : null;
  }
};

// A helper to hide scrollbars elegantly
const scrollbarHide = {
  "&::-webkit-scrollbar": { display: "none" },
  "-ms-overflow-style": "none",
  "scrollbar-width": "none",
};

// Main Carousel Component
export const Carousel = forwardRef<HTMLDivElement, CarouselProps>(
  (
    {
      children, 
      className = "", 
      opts = {},
      orientation = "horizontal",
      setApi,
    },
    ref
  ) => {
    const carouselRef = useRef<HTMLDivElement>(null);
    const carouselContentRef = useRef<HTMLDivElement>(null);

    const [canScrollPrev, setCanScrollPrev] = useState(false);
    const [canScrollNext, setCanScrollNext] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [itemCount, setItemCount] = useState(0);

    // Touch/Swipe state
    const [swipeState, setSwipeState] = useState<SwipeState>({
      isDragging: false,
      startPos: null,
      currentPos: null,
      velocity: 0,
      direction: null
    });

    const eventListeners = useRef<Record<string, Array<() => void>>>({});
    const apiRef = useRef<CarouselApi | null>(null);

    // Default swipe options
    const swipeThreshold = opts.swipeThreshold || 50;
    const velocityThreshold = opts.velocityThreshold || 0.3;

    useImperativeHandle(ref, () => carouselRef.current as HTMLDivElement);

    const getScrollSnapList = useCallback(() => {
      if (!carouselContentRef.current) return [];
      const items = Array.from(carouselContentRef.current.children) as HTMLElement[];
      const containerSize = orientation === 'horizontal' ? carouselContentRef.current.offsetWidth : carouselContentRef.current.offsetHeight;
      
      let align = 0;
      if (opts.align === 'center') align = containerSize / 2;
      if (opts.align === 'end') align = containerSize;

      return items.map((item) => {
        const itemSize = orientation === 'horizontal' ? item.offsetWidth : item.offsetHeight;
        const itemStart = orientation === 'horizontal' ? item.offsetLeft : item.offsetTop;
        
        if (opts.align === 'start') {
          return itemStart;
        }
        
        // Default to center alignment calculation
        return itemStart - align + itemSize / 2;
      });
    }, [orientation, opts.align]);
    
    const scrollTo = useCallback((index: number, jump = false) => {
      const snaps = getScrollSnapList();
      const snap = snaps[index];
      if (snap === undefined || !carouselContentRef.current) return;

      carouselContentRef.current.scrollTo({
        top: orientation === 'vertical' ? snap : 0,
        left: orientation === 'horizontal' ? snap : 0,
        behavior: jump ? 'auto' : 'smooth',
      });
      setSelectedIndex(index);
    }, [getScrollSnapList, orientation]);

    const update = useCallback(() => {
      if (!carouselContentRef.current) return;
      const numItems = carouselContentRef.current.children.length;
      setItemCount(numItems);
    
      const snaps = getScrollSnapList();
      const scrollPos = orientation === 'horizontal' ? carouselContentRef.current.scrollLeft : carouselContentRef.current.scrollTop;
    
      let newSelectedIndex = 0;
      let smallestDiff = Infinity;
    
      snaps.forEach((snap, i) => {
        const diff = Math.abs(snap - scrollPos);
        if (diff < smallestDiff) {
          smallestDiff = diff;
          newSelectedIndex = i;
        }
      });
    
      setSelectedIndex(newSelectedIndex);
    
      if (opts.loop) {
        setCanScrollPrev(numItems > 0);
        setCanScrollNext(numItems > 0);
      } else {
        setCanScrollPrev(newSelectedIndex > 0);
        setCanScrollNext(newSelectedIndex < numItems - 1);
      }
      
      eventListeners.current.select?.forEach(cb => cb());
    }, [getScrollSnapList, orientation, opts.loop]);
    
    const scrollPrev = useCallback(() => {
      if (!apiRef.current) return;
      const { selectedIndex, itemCount } = apiRef.current.internal_state();
      const newIndex = opts.loop 
        ? (selectedIndex - 1 + itemCount) % itemCount 
        : Math.max(0, selectedIndex - 1);
      scrollTo(newIndex);
    }, [opts.loop, scrollTo]);

    const scrollNext = useCallback(() => {
      if (!apiRef.current) return;
      const { selectedIndex, itemCount } = apiRef.current.internal_state();
      const newIndex = opts.loop 
        ? (selectedIndex + 1) % itemCount 
        : Math.min(itemCount - 1, selectedIndex + 1);
      scrollTo(newIndex);
    }, [opts.loop, scrollTo]);

    // Touch event handlers
    const handleTouchStart = useCallback((e: TouchEvent | MouseEvent) => {
      const position = getTouchPosition(e);
      setSwipeState(prev => ({
        ...prev,
        isDragging: true,
        startPos: position,
        currentPos: position,
        direction: null
      }));

      // Add visual feedback
      if (carouselContentRef.current) {
        carouselContentRef.current.style.cursor = 'grabbing';
        carouselContentRef.current.style.userSelect = 'none';
      }
    }, []);

    const handleTouchMove = useCallback((e: TouchEvent | MouseEvent) => {
      if (!swipeState.isDragging || !swipeState.startPos || !carouselContentRef.current) return;

      const position = getTouchPosition(e);
      const direction = getSwipeDirection(swipeState.startPos, position, orientation);

      setSwipeState(prev => ({ ...prev, currentPos: position, direction }));
      
      // Prevent default scroll behavior only for horizontal swipes
      if (direction === 'left' || direction === 'right') {
        e.preventDefault();
      }

      const delta = orientation === 'horizontal' 
        ? position.x - swipeState.startPos.x
        : position.y - swipeState.startPos.y;

      const scrollPosition = (orientation === 'horizontal' ? carouselContentRef.current.scrollLeft : carouselContentRef.current.scrollTop) - delta;

      if (orientation === 'horizontal') {
        carouselContentRef.current.scrollLeft = scrollPosition;
      } else {
        carouselContentRef.current.scrollTop = scrollPosition;
      }
    }, [swipeState.isDragging, swipeState.startPos, orientation]);

    const handleTouchEnd = useCallback((e: TouchEvent | MouseEvent) => {
      if (!swipeState.isDragging || !swipeState.startPos || !swipeState.currentPos) {
        setSwipeState({ isDragging: false, startPos: null, currentPos: null, velocity: 0, direction: null });
        return;
      }

      const velocity = calculateVelocity(swipeState.startPos, swipeState.currentPos);
      const distance = orientation === 'horizontal'
        ? swipeState.currentPos.x - swipeState.startPos.x
        : swipeState.currentPos.y - swipeState.startPos.y;

      const direction = swipeState.direction;
      const threshold = swipeThreshold / 2; // Make it a bit easier to trigger a swipe

      setSwipeState({ isDragging: false, startPos: null, currentPos: null, velocity: 0, direction: null });

      if (carouselContentRef.current) {
        carouselContentRef.current.style.cursor = 'grab';
        carouselContentRef.current.style.userSelect = '';
      }

      if (direction === 'left' && (Math.abs(distance) > threshold || velocity > velocityThreshold)) {
        scrollNext();
      } else if (direction === 'right' && (Math.abs(distance) > threshold || velocity > velocityThreshold)) {
        scrollPrev();
      } else {
        // Snap back to the current item if not a valid swipe
        scrollTo(selectedIndex, false);
      }
    }, [swipeState, orientation, scrollNext, scrollPrev, scrollTo, selectedIndex, swipeThreshold, velocityThreshold]);

    // Setup touch event listeners
    useEffect(() => {
      const element = carouselContentRef.current;
      if (!element) return;

      // Touch events for mobile
      element.addEventListener('touchstart', handleTouchStart, { passive: false });
      element.addEventListener('touchmove', handleTouchMove, { passive: false });
      element.addEventListener('touchend', handleTouchEnd);

      // Mouse events for desktop
      element.addEventListener('mousedown', handleTouchStart);
      element.addEventListener('mousemove', handleTouchMove);
      element.addEventListener('mouseup', handleTouchEnd);
      element.addEventListener('mouseleave', handleTouchEnd);

      return () => {
        element.removeEventListener('touchstart', handleTouchStart);
        element.removeEventListener('touchmove', handleTouchMove);
        element.removeEventListener('touchend', handleTouchEnd);
        element.removeEventListener('mousedown', handleTouchStart);
        element.removeEventListener('mousemove', handleTouchMove);
        element.removeEventListener('mouseup', handleTouchEnd);
        element.removeEventListener('mouseleave', handleTouchEnd);
      };
    }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

    useEffect(() => {
      const el = carouselContentRef.current;
      if (!el) return;

      const handleScroll = () => {
        // Use a timeout to debounce the update function
        setTimeout(update, 100);
      };

      el.addEventListener('scroll', handleScroll, { passive: true });
      return () => el.removeEventListener('scroll', handleScroll);
    }, [update]);

    // Initialize and update API
    useEffect(() => {
      if (!carouselContentRef.current) return;
      
      const api = apiRef.current ?? {
        scrollPrev,
        scrollNext,
        scrollTo,
        selectedScrollSnap: () => selectedIndex,
        scrollSnapList: getScrollSnapList,
        on: (event, cb) => {
          if (!eventListeners.current[event]) eventListeners.current[event] = [];
          eventListeners.current[event].push(cb);
        },
        off: (event, cb) => {
          eventListeners.current[event] = eventListeners.current[event]?.filter((c) => c !== cb) || [];
        },
        internal_state: () => ({ selectedIndex, itemCount }),
      };

      apiRef.current = {
        ...api,
        canScrollPrev,
        canScrollNext,
      };
      
      if (setApi && !apiRef.current.initialized) {
        setApi(apiRef.current);
        apiRef.current.initialized = true;
      }
      
      const handleScroll = () => {
        setTimeout(() => update(), 100);
      };

      const contentEl = carouselContentRef.current;
      contentEl?.addEventListener('scroll', handleScroll, { passive: true });

      const mutationObserver = new MutationObserver(update);
      mutationObserver.observe(contentEl, { childList: true });

      update();

      return () => {
        contentEl?.removeEventListener('scroll', handleScroll);
        mutationObserver.disconnect();
      };
    }, [
      canScrollPrev,
      canScrollNext,
      getScrollSnapList, 
      itemCount, 
      scrollNext, 
      scrollPrev, 
      scrollTo, 
      selectedIndex,
      setApi, 
      update
    ]);

    return (
      <CarouselContext.Provider
        value={{
          api: apiRef.current,
          carouselRef,
          carouselContentRef,
          orientation,
          opts,
          swipeState,
        }}
      >
        <div
          ref={carouselRef}
          className={`relative ${className}`}
          role="region"
          aria-roledescription="carousel"
        >
          {children}
        </div>
      </CarouselContext.Provider>
    );
  }
);
Carousel.displayName = "Carousel";

export const useCarousel = () => {
  const context = useContext(CarouselContext);
  if (!context) {
    throw new Error("useCarousel must be used within a CarouselProvider");
  }
  return context;
};

// Carousel Content
export const CarouselContent = forwardRef<HTMLDivElement, CarouselContentProps>(
  ({ children, className = "" }, ref) => {
    const { carouselContentRef, orientation } = useCarousel();
    useImperativeHandle(ref, () => carouselContentRef.current as HTMLDivElement);
    return (
      <div 
        ref={carouselContentRef}
        className={cn(
          "flex overflow-hidden",
          orientation === "horizontal" ? "overflow-x-auto" : "overflow-y-auto flex-col",
          "scroll-smooth snap-mandatory snap-x",
          className
        )}
        style={scrollbarHide}
      >
        {children}
      </div>
    );
  }
);
CarouselContent.displayName = "CarouselContent";

// Carousel Item
export const CarouselItem = forwardRef<HTMLDivElement, CarouselItemProps>(
  ({ children, className = "" }, ref) => {
    const { orientation } = useCarousel();
    return (
      <div
        ref={ref}
        role="group"
        aria-roledescription="slide"
        className={cn(
          "min-w-0 shrink-0 grow-0 basis-full snap-start",
          orientation === "horizontal" ? "pl-4" : "pt-4",
          className
        )}
      >
        {children}
      </div>
    );
  }
);
CarouselItem.displayName = "CarouselItem";

// Buttons and hooks
export const CarouselPrevious = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { orientation, api } = useCarousel();

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
        "absolute h-12 w-12 rounded-full z-10 bg-black/50 hover:bg-black/75 border-2 border-amber-400/30 text-amber-400 transition-all duration-300 hover:scale-110 touch-manipulation",
        orientation === "horizontal"
          ? "left-4 top-1/2 -translate-y-1/2"
          : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
        className
      )}
      disabled={!api?.canScrollPrev}
      onClick={api?.scrollPrev}
      aria-label="Previous slide"
      {...props}
    >
      <ArrowLeft className="h-5 w-5" />
      <span className="sr-only">Previous slide</span>
    </Button>
  );
});
CarouselPrevious.displayName = "CarouselPrevious"

export const CarouselNext = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { orientation, api } = useCarousel();

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
        "absolute h-12 w-12 rounded-full z-10 bg-black/50 hover:bg-black/75 border-2 border-amber-400/30 text-amber-400 transition-all duration-300 hover:scale-110 touch-manipulation",
        orientation === "horizontal"
          ? "right-4 top-1/2 -translate-y-1/2"
          : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
        className
      )}
      disabled={!api?.canScrollNext}
      onClick={api?.scrollNext}
      aria-label="Next slide"
      {...props}
    >
      <ArrowRight className="h-5 w-5" />
      <span className="sr-only">Next slide</span>
    </Button>
  );
});
CarouselNext.displayName = "CarouselNext"