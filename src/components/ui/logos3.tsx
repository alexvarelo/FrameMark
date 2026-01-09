"use client";

import AutoScroll from "embla-carousel-auto-scroll";

import {
    Carousel,
    CarouselContent,
    CarouselItem,
} from "./carousel";

interface Logo {
    id: string;
    description: string;
    image: string;
    className?: string;
}

interface Logos3Props {
    heading?: string;
    logos?: Logo[];
    className?: string;
}

const Logos3 = ({
    heading = "Trusted by these companies",
    logos = [],
}: Logos3Props) => {
    return (
        <section className="py-12 md:py-24">
            <div className="container flex flex-col items-center text-center mx-auto px-6">
                <h2 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-400 uppercase tracking-[0.2em] mb-4">
                    {heading}
                </h2>
            </div>
            <div className="pt-10 md:pt-16">
                <div className="relative mx-auto flex items-center justify-center lg:max-w-7xl px-6">
                    <Carousel
                        opts={{ loop: true }}
                        plugins={[AutoScroll({ playOnInit: true, speed: 1 })]}
                        className="w-full"
                    >
                        <CarouselContent className="ml-0">
                            {logos.map((logo) => (
                                <CarouselItem
                                    key={logo.id}
                                    className="flex basis-1/2 justify-center pl-0 sm:basis-1/3 md:basis-1/3 lg:basis-1/4"
                                >
                                    <div className="mx-20 md:mx-32 flex shrink-0 items-center justify-center transition-all duration-300">
                                        <div>
                                            <img
                                                src={logo.image}
                                                alt={logo.description}
                                                className={logo.className || "h-5 md:h-8 w-auto object-contain"}
                                            />
                                        </div>
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                    </Carousel>
                    <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-neutral-50 to-transparent z-10 pointer-events-none"></div>
                    <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-neutral-50 to-transparent z-10 pointer-events-none"></div>
                </div>
            </div>
        </section>
    );
};

export { Logos3 };
