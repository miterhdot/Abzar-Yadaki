"use client";

import { useState, type FormEvent } from "react";
import { F, dg, fa } from "@/lib/format";
import { useAuth, useData, useRoute, useUI } from "@/lib/shop-state";
import { LogoMark } from "../bits";
import { Crumb } from "../bits-helper";

type Step = "phone" | "code" | "name";

/** ورود / ثبت‌نام با کد یکبارمصرف پیامکی (نمایشی) */
export function AuthView() {
  const go = useRoute((s) => s.go);
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState("");

  const sendCode = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const m = dg(phone.trim());
    if (!/^09\d{9}$/.test(m)) {
      useUI.getState().say("شماره موبایل معتبر نیست");
      return;
    }
    const c = String(Math.floor(10000 + Math.random() * 90000));
    setSent(c);
    setStep("code");
    useUI.getState().say(`کد یکبارمصرف (نمایشی): ${fa(c)}`);
  };

  const verify = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (dg(code.trim()) !== sent) {
      useUI.getState().say("کد وارد شده صحیح نیست");
      return;
    }
    const m = dg(phone.trim());
    const known = useData.getState().users.find((u) => dg(u.phone) === m);
    if (known) {
      useAuth.getState().login({ name: known.name, phone: m });
      useUI.getState().say(`خوش آمدید ${known.name} ✓`);
      go("account", { q: "" });
    } else {
      setStep("name");
    }
  };

  const register = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const name = (e.currentTarget.elements.namedItem("n") as HTMLInputElement).value.trim();
    if (name.length < 3) {
      useUI.getState().say("نام را کامل وارد کنید");
      return;
    }
    const m = dg(phone.trim());
    useData.getState().upsertUser(name, m);
    useAuth.getState().login({ name, phone: m });
    useUI.getState().say("حساب شما ساخته شد ✓");
    go("account", { q: "" });
  };

  return (
    <>
      <Crumb parts={["ورود / ثبت‌نام"]} />
      <div className="w" style={{ maxWidth: 460, paddingTop: 10, paddingBottom: 30 }}>
        <div className="panel" style={{ textAlign: "center", marginBottom: 14 }}>
          <div style={{ display: "inline-block" }}>
            <LogoMark size={56} />
          </div>
          <h2 style={{ justifyContent: "center", margin: "10px 0 4px" }}>
            {step === "name" ? "تکمیل ثبت‌نام" : "ورود به ابزار یدکی"}
          </h2>
          <small style={{ color: "var(--mute)" }}>
            {step === "phone" && "شماره موبایل خود را وارد کنید تا کد یکبارمصرف ارسال شود."}
            {step === "code" && `کد ارسال‌شده به ${fa(dg(phone))} را وارد کنید.`}
            {step === "name" && "فقط نام و نام خانوادگی‌تان را وارد کنید."}
          </small>
        </div>

        {step === "phone" && (
          <form className="panel fm" onSubmit={sendCode}>
            <label>
              شماره موبایل
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="numeric"
                placeholder="۰۹۱۲···"
                autoFocus
                required
              />
            </label>
            <button className="btn" style={{ padding: 12 }} type="submit">
              ارسال کد یکبارمصرف
            </button>
            <small style={{ color: "var(--mute)" }}>
              ورود به معنای پذیرش <a href="#terms" style={{ color: "var(--or)" }}>قوانین و مقررات</a> است.
            </small>
          </form>
        )}

        {step === "code" && (
          <form className="panel fm" onSubmit={verify}>
            <label>
              کد یکبارمصرف (۵ رقم)
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                inputMode="numeric"
                maxLength={5}
                autoFocus
                required
              />
            </label>
            <button className="btn" style={{ padding: 12 }} type="submit">
              ورود
            </button>
            <button className="btn ghost" type="button" onClick={() => setStep("phone")}>
              تغییر شماره / ارسال مجدد
            </button>
          </form>
        )}

        {step === "name" && (
          <form className="panel fm" onSubmit={register}>
            <label>
              نام و نام خانوادگی
              <input name="n" autoFocus required />
            </label>
            <button className="btn" style={{ padding: 12 }} type="submit">
              ساخت حساب و ورود
            </button>
          </form>
        )}
      </div>
    </>
  );
}
