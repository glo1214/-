/* ------------------------------------------------------------------
   제출용 한 장 이미지 만들기

   외부 라이브러리 없이 canvas 에 직접 그린다.
   (html-to-image 같은 도구는 한글 웹폰트가 빠지면 글자가 깨진다.
    시스템 폰트로 직접 그리면 그럴 일이 없다)

   나오는 그림 한 장에 글과 과정이 함께 들어간다 —
   무엇을 썼는지뿐 아니라 어떻게 만들어졌는지가 보이도록.
------------------------------------------------------------------ */

const W = 1080;
const PAD = 64;
const FONT = `-apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR", system-ui, sans-serif`;

const COLOR = {
  paper: "#FDFBF6",
  card: "#FFFFFF",
  line: "#E9E2D4",
  soft: "#F7F2E7",
  ink: "#2A2622",
  mid: "#4B443C",
  faint: "#7B7268",
  ochre: "#C08A2E",
  ochreSoft: "#FCF6E6",
};

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* 글자를 폭에 맞춰 줄바꿈한다. 한글은 단어 단위로 끊기지 않으므로
   공백 우선으로 자르되, 한 덩어리가 너무 길면 글자 단위로 자른다. */
function wrap(ctx, text, maxWidth) {
  const lines = [];
  for (const paragraph of String(text || "").split(/\n/)) {
    if (!paragraph.trim()) {
      lines.push("");
      continue;
    }
    let line = "";
    for (const chunk of paragraph.split(/(\s+)/)) {
      const next = line + chunk;
      if (ctx.measureText(next).width <= maxWidth) {
        line = next;
        continue;
      }
      if (line.trim()) lines.push(line.trimEnd());
      if (ctx.measureText(chunk).width <= maxWidth) {
        line = chunk.trimStart();
      } else {
        let piece = "";
        for (const ch of chunk) {
          if (ctx.measureText(piece + ch).width > maxWidth) {
            lines.push(piece);
            piece = ch;
          } else piece += ch;
        }
        line = piece;
      }
    }
    if (line.trim()) lines.push(line.trimEnd());
  }
  return lines;
}

function measureBody(text, maxWidth) {
  const probe = document.createElement("canvas").getContext("2d");
  probe.font = `28px ${FONT}`;
  return wrap(probe, text, maxWidth);
}

/**
 * @param {object} data
 *  title, author, dateText, bodyText, keywords[], frameLabel, stats[{label,value}], note
 * @returns {string} PNG data URL
 */
export function renderSubmissionImage(data) {
  const innerW = W - PAD * 2;
  const textW = innerW - 56 * 2;

  const bodyLines = measureBody(data.bodyText || "", textW);
  const bodyHeight = bodyLines.length * 46;

  const headerH = 190;
  const keywordH = data.keywords?.length ? 96 : 0;
  const statsH = data.stats?.length ? 132 : 0;
  const footerH = 148;
  const H = Math.max(760, headerH + keywordH + bodyHeight + 96 + statsH + footerH);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  ctx.textBaseline = "top";

  // 바탕
  ctx.fillStyle = COLOR.paper;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = COLOR.card;
  roundRect(ctx, PAD, PAD, innerW, H - PAD * 2, 28);
  ctx.fill();
  ctx.strokeStyle = COLOR.line;
  ctx.lineWidth = 2;
  ctx.stroke();

  const x = PAD + 56;
  let y = PAD + 52;

  // 머리말
  ctx.fillStyle = COLOR.ochre;
  ctx.font = `600 22px ${FONT}`;
  ctx.fillText(data.eyebrow || "글로온 생각온 · 내가 쓴 글", x, y);
  y += 40;

  ctx.fillStyle = COLOR.ink;
  ctx.font = `700 46px ${FONT}`;
  const titleLines = wrap(ctx, data.title || "제목 없는 글", textW).slice(0, 2);
  for (const line of titleLines) {
    ctx.fillText(line, x, y);
    y += 58;
  }

  ctx.fillStyle = COLOR.faint;
  ctx.font = `24px ${FONT}`;
  ctx.fillText([data.author, data.dateText].filter(Boolean).join(" · "), x, y);
  y += 52;

  // 키워드
  if (data.keywords?.length) {
    ctx.font = `24px ${FONT}`;
    let cx = x;
    for (const word of data.keywords.slice(0, 6)) {
      const w = ctx.measureText(word).width + 36;
      if (cx + w > x + textW) break;
      ctx.fillStyle = COLOR.ochreSoft;
      roundRect(ctx, cx, y, w, 44, 22);
      ctx.fill();
      ctx.fillStyle = COLOR.ochre;
      ctx.fillText(word, cx + 18, y + 9);
      cx += w + 10;
    }
    y += 76;
  }

  // 가로선
  ctx.strokeStyle = COLOR.line;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + textW, y);
  ctx.stroke();
  y += 40;

  // 본문
  ctx.fillStyle = COLOR.mid;
  ctx.font = `28px ${FONT}`;
  for (const line of bodyLines) {
    ctx.fillText(line, x, y);
    y += 46;
  }
  y += 36;

  // 과정 요약
  if (data.stats?.length) {
    ctx.fillStyle = COLOR.soft;
    roundRect(ctx, x, y, textW, 100, 18);
    ctx.fill();
    const cell = textW / data.stats.length;
    data.stats.forEach((s, i) => {
      const cxx = x + cell * i + 24;
      ctx.fillStyle = COLOR.faint;
      ctx.font = `20px ${FONT}`;
      ctx.fillText(s.label, cxx, y + 22);
      ctx.fillStyle = COLOR.ink;
      ctx.font = `600 28px ${FONT}`;
      ctx.fillText(String(s.value), cxx, y + 52);
    });
    y += 140;
  }

  // 꼬리말
  ctx.fillStyle = COLOR.faint;
  ctx.font = `20px ${FONT}`;
  ctx.fillText(data.note || "AI와 나눈 질문을 참고해 학생이 직접 쓴 글입니다.", x, H - PAD - 44);

  return canvas.toDataURL("image/png");
}

export function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}
