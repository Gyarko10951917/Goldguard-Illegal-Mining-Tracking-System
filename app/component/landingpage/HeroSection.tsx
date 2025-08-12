import Image from "next/image";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="bg-white pt-20">
      <div className="relative w-full rounded-lg overflow-hidden shadow-lg">
        <Image
          src="/assert/cc.png"
          alt="Mining site"
          width={1200}
          height={500}
          className="object-cover w-full h-96"
          priority
        />
        <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-4">
          <Image
            src="/assert/cc.png"
            alt="Overlay"
            fill
            style={{ objectFit: "cover" }}
            className="opacity-40"
            priority
          />
          <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-4">
            <h1 className="text-white text-4xl sm:text-5xl font-serif font-bold max-w-3xl">
              Join the Fight to Protect Ghana&apos;s Natural Resources
            </h1>
            <p className="text-white mt-4 max-w-xl">
              Report illegal mining activities and contribute to a sustainable future
            </p>
            <Link href="/report">
              <span className="mt-6 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-2 px-6 rounded-full shadow-md transition inline-block cursor-pointer">
                Report an Incident
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
