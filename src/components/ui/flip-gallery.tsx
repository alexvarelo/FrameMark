import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const images = [
    { title: 'Example 1', url: '/examples/example1.jpg' },
    { title: 'Example 2', url: '/examples/example2.jpg' },
    { title: 'Example 3', url: '/examples/example3.jpg' },
    { title: 'Example 4', url: '/examples/example4.jpg' },
    { title: 'Example 5', url: '/examples/example5.jpg' },
];

const FLIP_SPEED = 750;
const flipTiming = { duration: FLIP_SPEED, iterations: 1 };

// flip down
const flipAnimationTop = [
    { transform: 'rotateX(0)' },
    { transform: 'rotateX(-90deg)' },
    { transform: 'rotateX(-90deg)' }
];
const flipAnimationBottom = [
    { transform: 'rotateX(90deg)' },
    { transform: 'rotateX(90deg)' },
    { transform: 'rotateX(0)' }
];

// flip up
const flipAnimationTopReverse = [
    { transform: 'rotateX(-90deg)' },
    { transform: 'rotateX(-90deg)' },
    { transform: 'rotateX(0)' }
];
const flipAnimationBottomReverse = [
    { transform: 'rotateX(0)' },
    { transform: 'rotateX(90deg)' },
    { transform: 'rotateX(90deg)' }
];

export default function FlipGallery() {
    const containerRef = useRef<HTMLDivElement>(null);
    const uniteRef = useRef<NodeListOf<HTMLDivElement> | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    // initialise first image once
    useEffect(() => {
        if (!containerRef.current) return;
        uniteRef.current = containerRef.current.querySelectorAll('.unite');
        defineFirstImg();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Auto-flip every 5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            updateIndex(1);
        }, 5000);

        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentIndex]);

    const defineFirstImg = () => {
        if (!uniteRef.current) return;
        uniteRef.current.forEach(setActiveImage);
        setImageTitle();
    };

    const setActiveImage = (el: HTMLDivElement) => {
        el.style.backgroundImage = `url('${images[currentIndex].url}')`;
    };

    const setImageTitle = () => {
        const gallery = containerRef.current;
        if (!gallery) return;
        gallery.setAttribute('data-title', images[currentIndex].title);
        gallery.style.setProperty('--title-y', '0');
        gallery.style.setProperty('--title-opacity', '1');
    };

    const updateGallery = (isReverse = false) => {
        const gallery = containerRef.current;
        if (!gallery) return;

        // determine direction animation arrays
        const topAnim = isReverse ? flipAnimationTopReverse : flipAnimationTop;
        const bottomAnim = isReverse
            ? flipAnimationBottomReverse
            : flipAnimationBottom;

        gallery.querySelector('.overlay-top')?.animate(topAnim, flipTiming);
        gallery.querySelector('.overlay-bottom')?.animate(bottomAnim, flipTiming);

        // hide title
        gallery.style.setProperty('--title-y', '-1rem');
        gallery.style.setProperty('--title-opacity', '0');
        gallery.setAttribute('data-title', '');

        // update images with slight delay so animation looks continuous
        if (!uniteRef.current) return;
        uniteRef.current.forEach((el, idx) => {
            const delay =
                (isReverse && (idx !== 1 && idx !== 2)) ||
                    (!isReverse && (idx === 1 || idx === 2))
                    ? FLIP_SPEED - 200
                    : 0;

            setTimeout(() => setActiveImage(el), delay);
        });

        // reveal new title roughly half‑way through animation
        setTimeout(setImageTitle, FLIP_SPEED * 0.5);
    };

    const updateIndex = (increment: number) => {
        const inc = Number(increment);
        const newIndex = (currentIndex + inc + images.length) % images.length;
        const isReverse = inc < 0;
        setCurrentIndex(newIndex);
        updateGallery(isReverse);
    };

    return (
        <div className='flex items-center justify-center'>
            <div
                className='relative bg-neutral-100 border border-neutral-200 p-2 rounded-lg'
                style={{ '--gallery-bg-color': 'rgba(0 0 0 / 0.05)' } as React.CSSProperties}
            >
                {/* flip gallery - larger size */}
                <div
                    id='flip-gallery'
                    ref={containerRef}
                    className='relative w-[280px] h-[467px] md:w-[320px] md:h-[533px] text-center'
                    style={{ perspective: '800px' }}
                >
                    <div className='top unite bg-cover bg-no-repeat'></div>
                    <div className='bottom unite bg-cover bg-no-repeat'></div>
                    <div className='overlay-top unite bg-cover bg-no-repeat'></div>
                    <div className='overlay-bottom unite bg-cover bg-no-repeat'></div>
                </div>

                {/* navigation */}
                <div className='absolute top-full right-0 mt-2 flex gap-2'>
                    <button
                        type='button'
                        onClick={() => updateIndex(-1)}
                        title='Previous'
                        className='text-neutral-600 hover:text-neutral-900 hover:scale-125 transition'
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        type='button'
                        onClick={() => updateIndex(1)}
                        title='Next'
                        className='text-neutral-600 hover:text-neutral-900 hover:scale-125 transition'
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* component-scoped styles that Tailwind cannot express */}
            <style>{`
        #flip-gallery::after {
          content: '';
          position: absolute;
          background-color: rgba(0, 0, 0, 0.15);
          width: 100%;
          height: 2px;
          top: 50%;
          left: 0;
          transform: translateY(-50%);
        }

        #flip-gallery::before {
          content: attr(data-title);
          color: rgba(0 0 0 / 0.5);
          font-size: 0.75rem;
          left: -0.5rem;
          position: absolute;
          top: calc(100% + 1rem);
          line-height: 2;
          opacity: var(--title-opacity, 0);
          transform: translateY(var(--title-y, 0));
          transition: opacity 500ms ease-in-out, transform 500ms ease-in-out;
        }

        #flip-gallery > * {
          position: absolute;
          width: 100%;
          height: 50%;
          overflow: hidden;
          background-size: 280px 467px;
        }

        @media (min-width: 768px) {
          #flip-gallery > * {
            background-size: 320px 533px;
          }
        }

        .top,
        .overlay-top {
          top: 0;
          transform-origin: bottom;
          background-position: top;
        }

        .bottom,
        .overlay-bottom {
          bottom: 0;
          transform-origin: top;
          background-position: bottom;
        }
      `}</style>
        </div>
    );
}
