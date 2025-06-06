import React, { useRef, useState, useEffect, createContext, useContext, useMemo } from "react";

interface iProps {
  children: React.ReactNode;
  speed?: number;
  auto?: boolean;
  interval?: number;
  slidesToShow?: number;
}

interface iController {
  children?: React.ReactNode;
  className?: string;
}

const CarouselContext = createContext<{
  prevSlide: () => void;
  nextSlide: () => void;
  isTransitioning: boolean;
  totalSlides: number;
  index: number;
  setIndex: (index: number) => void;
  isJump: boolean;
  speed: number;
  slidesToShow: number;
} | null>(null);

/**
 * Carousel
 * @param speed - optional default 0.3
 * @param auto - optional boolean for auto slide
 * @param interval - optional default 3000
 * @param slidesToShow - optional default 1
 * @usage wrap element &lt;Carousel ref={ref}&gt;{your element}&lt;/Carousel&gt;
 * @example 
 * ```tsx
 * <div className="w-[300px] h-[300px] rounded overflow-hidden">
        <Carousel speed={0.4} auto>
          <Carousel.LeftButton className="text-xl cursor-pointer">Left</Carousel.LeftButton>
          <Carousel.RightButton>Right</Carousel.RightButton>
          <Carousel.Bullet />
          <Carousel.Slider>
            <div className="w-full h-full bg-pink-200">0</div>
            <div className="w-full h-full bg-pink-400">1</div>
            <div className="w-full h-full bg-pink-600">2</div>
            <div className="w-full h-full bg-pink-800">3</div>
          </Carousel.Slider>
        </Carousel>
      </div>
 * ```
 */

export function Carousel({ children, speed = 0.3, auto, interval = 3000, slidesToShow = 1 }: iProps) {
  const [index, setIndex] = useState(1); // Start at 1 because of prepended clone
  const [isJump, setIsJump] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [resetAutoOnBtnClick, setResetAutoOnBtnClick] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Find the Slider component to get the actual slide count
  const sliderChild = React.Children.toArray(children).find(
    (child) => React.isValidElement(child) && child.type === Carousel.Slider
  ) as React.ReactElement<{ children: React.ReactNode }> | undefined;

  const totalSlides = sliderChild ? Math.ceil(React.Children.count(sliderChild.props.children) / slidesToShow) : 0;

  // alert(totalSlides);

  const prevSlide = () => {
    setResetAutoOnBtnClick(true);
    setIsJump(false);
    setIndex((prev) => prev - 1);
  };

  const nextSlide = () => {
    setResetAutoOnBtnClick(true);
    setIsJump(false);
    setIndex((prev) => prev + 1);
  };

  // handle transition and jump
  useEffect(() => {
    if (index === 0) {
      // Jump from first clone to last real slide
      const timer = setTimeout(() => {
        setIsJump(true);
        setIndex(totalSlides);
      }, speed * 1000);
      return () => clearTimeout(timer);
    }

    if (index === totalSlides + 1) {
      // Jump from last clone to first real slide
      const timer = setTimeout(() => {
        setIsJump(true);
        setIndex(1);
      }, speed * 1000);
      return () => clearTimeout(timer);
    }

    // Set transition duration
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, speed * 1000);
    return () => clearTimeout(timer);
  }, [index, speed, totalSlides]);

  // Pause the interval if button is pressed
  useEffect(() => {
    if (!auto) return;
    if (!resetAutoOnBtnClick) return;

    const pauseTimeout = setTimeout(() => {
      setResetAutoOnBtnClick(false);
    }, 4000);

    return () => clearTimeout(pauseTimeout);
  }, [auto, resetAutoOnBtnClick]);

  // Main auto-slide interval
  useEffect(() => {
    if (!auto || resetAutoOnBtnClick) return;

    const interVal = setInterval(() => {
      setIsJump(false);
      setIndex((prev) => prev + 1);
    }, interval);

    return () => clearInterval(interVal);
  }, [auto, interval, resetAutoOnBtnClick]);

  return (
    <CarouselContext.Provider
      value={{ prevSlide, nextSlide, isTransitioning, totalSlides, index, isJump, speed, setIndex, slidesToShow }}
    >
      <div
        ref={ref}
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Render children including buttons */}
        {React.Children.map(children, (child, i) =>
          React.isValidElement(child) ? <React.Fragment key={i}>{child}</React.Fragment> : null
        )}
      </div>
    </CarouselContext.Provider>
  );
}

Carousel.Slider = function Slider({ children }: { children: React.ReactNode }) {
  const ctx = useContext(CarouselContext);
  if (!ctx) return null;

  const childrenArray = React.Children.toArray(children);
  // const slidesToShow = 4;

  // group the slides into 2
  const groupedSlides = [];
  for (let i = 0; i < childrenArray.length; i += ctx.slidesToShow) {
    groupedSlides.push(childrenArray.slice(i, i + ctx.slidesToShow));
  }
  // const totalSlides = groupedSlides.length;

  // alert(totalSlides);

  return (
    <div
      style={{
        width: `${(ctx.totalSlides + 2) * 100}%`, // +2 for clones
        height: "100%",
        display: "flex",
        transform: `translateX(-${ctx.index * (100 / (ctx.totalSlides + 2))}%)`,
        transition: ctx.isJump ? "none" : `transform ${ctx.speed}s ease`,
      }}
    >
      {/* Clone of last slide */}
      <div style={{ width: `${100 / (ctx.totalSlides + 2)}%`, flexShrink: 0, display: "flex" }}>
        {groupedSlides[ctx.totalSlides - 1].map((slide, i) => (
          <div key={i} style={{ width: `${100 / ctx.slidesToShow}%`, flexShrink: 0 }}>
            {slide}
          </div>
        ))}
      </div>

      {/* Real slides */}
      {groupedSlides.map((group, i) => (
        <div key={i} style={{ width: `${100 / (ctx.totalSlides + 2)}%`, flexShrink: 0, display: "flex" }}>
          {group.map((slide, i) => (
            <div key={i} style={{ width: `${100 / ctx.slidesToShow}%`, flexShrink: 0 }}>
              {slide}
            </div>
          ))}
        </div>
      ))}

      {/* Clone of first slide */}
      <div style={{ width: `${100 / (ctx.totalSlides + 2)}%`, flexShrink: 0, display: "flex" }}>
        {groupedSlides[0].map((slide, i) => (
          <div key={i} style={{ width: `${100 / ctx.slidesToShow}%`, flexShrink: 0 }}>
            {slide}
          </div>
        ))}
      </div>
    </div>
  );
};

Carousel.LeftButton = function LeftButton({ children, className }: iController) {
  const ctx = useContext(CarouselContext);
  if (!ctx) return null;
  return (
    <button
      className={className}
      onClick={ctx.prevSlide}
      disabled={ctx.isTransitioning}
      aria-label="Previous slide"
      style={{
        position: "absolute",
        top: "50%",
        transform: "translateY(-50%)",
        left: "20px",
        zIndex: 1,
      }}
    >
      {children || "←"}
    </button>
  );
};

Carousel.RightButton = function RightButton({ children, className }: iController) {
  const ctx = useContext(CarouselContext);
  if (!ctx) return null;
  return (
    <button
      className={className}
      onClick={ctx.nextSlide}
      disabled={ctx.isTransitioning}
      aria-label="Next slide"
      style={{
        position: "absolute",
        top: "50%",
        transform: "translateY(-50%)",
        right: "20px",
        zIndex: 1,
      }}
    >
      {children || "→"}
    </button>
  );
};

Carousel.Bullet = function Bullet({ className }: iController) {
  const ctx = useContext(CarouselContext);
  if (!ctx) return null;

  const slides = Array.from({ length: ctx.totalSlides }, (_, i) => i);
  const index = ctx.index;

  return (
    <div
      className={className}
      style={{
        position: "absolute",
        left: "50%",
        transform: "translateX(-50%)",
        bottom: "20px",
        zIndex: 1,
        display: "flex",
        alignItems: "center",
        gap: "5px",
      }}
    >
      {slides.map((slide, i) => (
        <button
          key={i}
          onClick={() => ctx.setIndex(i+1)}
          aria-label={`Go to slide ${i + 1}`}
          style={{
            border: "solid thin #ccc",
            width: i === index - 1 ? "13px" : "10px",
            height: i === index - 1 ? "13px" : "10px",
            borderRadius: "50%",
            display: "inline-block",
            cursor: "pointer",
            backgroundColor: i === index - 1 ? "#666" : "transparent",
          }}
        ></button>
      ))}
    </div>
  );
};
