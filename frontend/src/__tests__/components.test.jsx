import { act, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import Footer from "../components/Footer";
import Logo from "../components/Logo";
import { setLang } from "../i18n";

const withRouter = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>);

afterEach(() => act(() => setLang("en")));

describe("<Logo />", () => {
  it("renders the deer image and the English wordmark", () => {
    render(<Logo />);
    expect(screen.getByRole("img", { name: "Sonarhorin" })).toHaveAttribute("src", "/logo-gold.png");
    expect(screen.getByText("Sonarhorin")).toBeInTheDocument();
  });
  it("switches wordmark to Bangla with the language", () => {
    render(<Logo />);
    act(() => setLang("bn"));
    expect(screen.getByText("সোনারহরিণ")).toBeInTheDocument();
  });
  it("bangla prop always shows the Bangla wordmark; showText=false hides it", () => {
    const { container, rerender } = render(<Logo bangla />);
    expect(container.querySelector(".word-bn")).toHaveTextContent("সোনারহরিণ");
    rerender(<Logo showText={false} size="lg" light />);
    expect(container.querySelector(".word")).toBeNull();
    expect(container.firstChild).toHaveClass("brand", "light", "logo-size-lg");
  });
});

describe("<Footer />", () => {
  it("renders the tagline and key links", () => {
    withRouter(<Footer />);
    expect(screen.getByText("Built for freshers. Made in Bangladesh.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Fresher jobs" })).toHaveAttribute("href", "/jobs");
    expect(screen.getByRole("link", { name: "Internships" })).toHaveAttribute("href", "/programs?kind=internship");
    expect(screen.getByRole("link", { name: "Success stories" })).toHaveAttribute("href", "/stories");
  });
  it("translates to Bangla", () => {
    withRouter(<Footer />);
    act(() => setLang("bn"));
    expect(screen.getByText("ফ্রেশারদের জন্য, বাংলাদেশে তৈরি।")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ফ্রেশার জব" })).toBeInTheDocument();
  });
});
