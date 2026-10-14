export type Photo = {
  src: string;
  alt: string;
  width: number;
  height: number;
  focal: string;
  credit?: string;
  source?: string;
};
const slot = (alt: string, width = 1000, height = 1000): Photo => ({
  src: "",
  alt,
  width,
  height,
  focal: "50% 50%",
});
// Replace empty slots with your own product photographs; never imply stock photography is inventory.
export const media = {
  founder: slot("Aditya Dhariwal, founder of Campus Bucket", 900, 1100),
  campus: {
    src: "/campus.webp",
    alt: "Campus buildings beside trees and a running track",
    width: 1600,
    height: 1066,
    focal: "50% 65%",
  },
  kits: {
    Hostel: slot(
      "Hostel Kit: bucket, towel and everyday room essentials",
      1000,
      1200,
    ),
    Student: slot(
      "Student Kit: notebooks, calculator and study essentials",
      1000,
      1200,
    ),
    Sports: slot(
      "Sports Kit: gym bag, skipping rope and training essentials",
      1000,
      1200,
    ),
    Bundle: slot("All three Fresher kits arranged together", 1400, 1000),
  } as Record<string, Photo>,
  alternate: {
    Hostel: slot("Hostel essentials unpacked in a student room", 1000, 1200),
    Student: slot("Study essentials laid out on a desk", 1000, 1200),
    Sports: slot("Sports essentials beside a campus playing field", 1000, 1200),
  } as Record<string, Photo>,
  products: {} as Record<string, Photo>,
  cutouts: {
    bucket: slot("Transparent photograph of the actual bucket"),
    towel: slot("Transparent photograph of the actual towel"),
    bottle: slot("Transparent photograph of the actual bottle"),
    notebook: slot("Transparent photograph of the actual notebook"),
  },
  why: [
    slot("A student's neatly packed move-in essentials", 1000, 650),
    slot("A real study desk in an Indian hostel", 1000, 650),
    slot("A student collecting a kit on campus", 1000, 650),
  ],
};
export function photoUrl(photo: Photo, width: number, format = "webp") {
  if (!photo.src) return "";
  if (photo.src.startsWith("https://images.unsplash.com/"))
    return `${photo.src}?fit=crop&w=${width}&q=80&fm=${format}`;
  return photo.src;
}
export function productPhoto(product: {
  id: string;
  name: string;
  image: string;
}): Photo {
  return (
    media.products[product.id] || {
      ...slot(`${product.name} on a clean backdrop`),
      src: /^https:\/\//.test(product.image) ? product.image : "",
    }
  );
}
