<template>
  <tr
    @contextmenu="onContextMenu"
    @mousedown="onMouseDown"
    @touchstart="onTouchStart"
    @touchend="onTouchEnd"
    @touchmove="onTouchMove"
    @focusin="onFocusIn"
    @focusout="onFocusOut"
  >
    <td v-show="!removeMode" class="index drag-handle">
      {{ index + 1 }}
    </td>
    <td v-show="removeMode" class="index remove-row">
      <button
        :disabled="!removeMode"
        class="button-remove"
        @click="handleRemoveRow"
        aria-label="行を削除"
      >
        <i-octicon-trash-24 />
      </button>
    </td>
    <td class="col-title">
      <input type="text" v-model="row.title" class="input-title" />
      <div class="floating-title" aria-hidden="true">{{ row.title }}</div>
    </td>
    <td>
      <div class="with-unit">
        <input type="number" inputmode="numeric" v-model="row.price" />
        <span>円</span>
      </div>
    </td>
    <td>
      <input type="number" inputmode="numeric" v-model="row.stock" />
    </td>
    <td>
      <label class="checkbox">
        <input type="checkbox" v-model="row.infiniteStock" />
      </label>
    </td>
    <td>
      <label class="checkbox">
        <input
          type="checkbox"
          v-model="row.hidden"
          :true-value="false"
          :false-value="true"
        />
      </label>
    </td>
    <td>
      <input type="date" v-model="row.pubdate" />
    </td>
    <td>
      <div class="with-unit">
        <input type="number" inputmode="numeric" v-model="row.cost" />
        <span>円</span>
      </div>
    </td>
    <td>
      <label class="checkbox">
        <input type="checkbox" v-model="row.r18" />
      </label>
    </td>
    <td>
      <input type="text" v-model="category" placeholder="カンマ区切り" />
    </td>
    <td>
      <input type="text" v-model="genre" placeholder="カンマ区切り" />
    </td>
    <td>
      <div class="image-control">
        <button
          class="button-preview"
          :disabled="!row.image"
          @click="handlePreview"
          aria-label="画像をプレビュー"
        >
          <i-octicon-zoom-in-16 />
        </button>
        <div class="input-image">
          <input
            type="file"
            accept="image/*"
            ref="imageInput"
            @change="handleImageChange"
          />
          <button class="button-select" @click="handleSelectImage">
            {{ row.image ? "画像を変更" : "画像を選択" }}
          </button>
        </div>
        <button
          class="button-remove"
          :disabled="!row.image"
          @click="handleRemoveImage"
          aria-label="画像を削除"
        >
          <i-octicon-trash-24 />
        </button>
      </div>
    </td>
  </tr>
</template>

<script setup lang="ts">
import { ref, useTemplateRef, computed, inject } from "vue";
import { convertToBase64 } from "@/utils/imageHelper";
import { DEFAULT_ROW } from "@/const/default";
import { gtmTrackEvent } from "@/utils/gtm.ts";

const props = defineProps<{
  index: number;
  row: typeof DEFAULT_ROW & {
    terms: { category?: string[]; genre?: string[] };
  };
  removeMode: boolean;
}>();

const emit = defineEmits<{
  (e: "remove", index: number): void;
  (e: "contextmenu", event: MouseEvent): void;
  (e: "focusin", index: number): void;
  (e: "focusout"): void;
}>();

const openLightBox = inject<(image: string) => void>("openLightBox");
const openDialog = inject<(opts?: { message?: string; type?: string } | string) => Promise<boolean>>("openDialog");

const handlePreview = () => {
  openLightBox?.(props.row.image);
};

const category = computed({
  get: () => props.row.terms?.category?.join(",") ?? "",
  set: (value) => {
    props.row.terms.category = value
      .split(",")
      .map((item: string) => item.trim())
      .filter((item: string) => item !== "");
  },
});

const genre = computed({
  get: () => props.row.terms?.genre?.join(",") ?? "",
  set: (value) => {
    props.row.terms.genre = value
      .split(",")
      .map((item: string) => item.trim())
      .filter((item: string) => item !== "");
  },
});

const imageInput = useTemplateRef<HTMLInputElement>("imageInput");
const image = ref<File | null>(null);

const handleSelectImage = () => {
  imageInput.value?.click();
  gtmTrackEvent("image_select");
};

const handleImageChange = async () => {
  const file = imageInput.value?.files?.[0];
  if (file) {
    image.value = file;
    const base64 = await convertToBase64(file);
    props.row.image = base64;
  }
};

const handleRemoveImage = async () => {
  const message = (props.row.title ? `「${props.row.title}」` : "このアイテム") + "の画像を削除してよろしいですか？";
  if (!(await openDialog?.({ message, type: "confirm" }))) return;

  if (imageInput.value) {
    imageInput.value.value = "";
  }
  image.value = null;
  props.row.image = "";
  gtmTrackEvent("image_removed");
};

const handleRemoveRow = () => {
  emit("remove", props.index);
};

// コンテキストメニュー
const onContextMenu = (event: MouseEvent) => {
  event.preventDefault();
  emit("contextmenu", event);
};

// Mac Safari用: mousedownで右クリックを検出
const onMouseDown = (event: MouseEvent) => {
  // 右クリック（button === 2）またはCtrl+クリック（Mac Safari）
  if (event.button === 2 || (event.ctrlKey && event.button === 0)) {
    event.preventDefault();
    emit("contextmenu", event);
  }
};

const longPressTimer = ref<number | null>(null);
const touchStartPos = ref<{ x: number; y: number } | null>(null);
const LONG_PRESS_DURATION = 300; // 500ms
const TOUCH_MOVE_THRESHOLD = 10; // 10px以上移動したら長押しをキャンセル

const onTouchStart = (event: TouchEvent) => {
  // ドラッグハンドルでのタッチは無視
  const target = event.target as HTMLElement;
  if (target.closest(".drag-handle")) {
    return;
  }

  const touch = event.touches[0];
  if (!touch) return;
  const touchX = touch.clientX;
  const touchY = touch.clientY;
  touchStartPos.value = { x: touchX, y: touchY };

  longPressTimer.value = window.setTimeout(() => {
    // 長押し検出
    event.preventDefault();
    const syntheticEvent = {
      clientX: touchX,
      clientY: touchY,
      preventDefault: () => {},
    } as MouseEvent;
    emit("contextmenu", syntheticEvent);
    longPressTimer.value = null;
    touchStartPos.value = null;
  }, LONG_PRESS_DURATION);
};

const onTouchMove = (event: TouchEvent) => {
  if (!touchStartPos.value || !longPressTimer.value) return;

  const touch = event.touches[0];
  if (!touch) return;
  const dx = Math.abs(touch.clientX - touchStartPos.value.x);
  const dy = Math.abs(touch.clientY - touchStartPos.value.y);

  // 一定以上移動したら長押しをキャンセル
  if (dx > TOUCH_MOVE_THRESHOLD || dy > TOUCH_MOVE_THRESHOLD) {
    if (longPressTimer.value) {
      clearTimeout(longPressTimer.value);
      longPressTimer.value = null;
    }
    touchStartPos.value = null;
  }
};

const onTouchEnd = () => {
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value);
    longPressTimer.value = null;
  }
  touchStartPos.value = null;
};

const onFocusIn = () => {
  emit("focusin", props.index);
};

const onFocusOut = () => {
  emit("focusout");
};
</script>
