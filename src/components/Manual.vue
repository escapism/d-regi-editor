<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-show="active" class="overlay" @click="close">
        <div
          class="manual-dialog"
          ref="dialog"
          role="dialog"
          aria-modal="true"
          tabindex="-1"
        >
          <div class="dialog-content">
            <p>
              <b>Dレジエディター</b>は「<a
                href="https://escapism.github.io/d-register/#/"
                target="_blank"
                rel="noopener"
                style="font-weight: 700"
                >Dレジ</a
              >」の頒布物情報を編集するためのWebエディターです。<br />アプリ内でのデータ保存機能はありません。都度JSON/CSVファイルをインポート・エクスポートしてください。
            </p>
            <h2>操作説明</h2>
            <dl>
              <dt>JSONエクスポート</dt>
              <dd>
                編集した頒布物情報を書き出します。「Dレジ」の頒布物管理画面からインポートしてください。
              </dd>
              <dt>JSONインポート</dt>
              <dd>
                「Dレジ」で書き出したJSONファイルをインポートします。設定画面で書き出したJSONの読み込みもできますが、編集できるのは頒布物情報だけです。
              </dd>
              <dt><i-octicon-trash-24 /> 削除モード切り替え</dt>
              <dd>
                オンにすると各行の行番号が削除ボタンに変わります。確認ダイアログは表示されないので、注意してください。<br />また、画面右下の追加ボタンは全削除ボタンに変わります。
              </dd>
              <dt><i-octicon-three-bars-24 /> メニューボタン</dt>
              <dd>
                メニュー一覧を開きます。以下の項目はこのメニュー内にあります。
              </dd>
              <dt>Dレジからインポート</dt>
              <dd>
                Dレジから頒布物情報を直接インポートします。同一ブラウザ内であればインポート可能です。ただし、iPhone・iPadでは、ホーム画面に追加したアプリと、ブラウザ上のアプリとではお互いに直接インポートはできません。<br>使用できない場合は表示されません。
              </dd>
              <dt>CSVエクスポート</dt>
              <dd>
                編集した頒布物情報をCSV形式で書き出します。表計算ソフトで編集したい場合にご利用ください。<br /><small
                  >※「Dレジ」でCSVのインポートはできません。このエディターでJSONに変換してください。</small
                >
              </dd>
              <dt>CSVインポート</dt>
              <dd>CSV形式のファイルをインポートします。ヘッダ行が必須です。</dd>
              <dt>カラーモード切り替え</dt>
              <dd>ライトモードとダークモードを切り替えます。</dd>
              <dt>マニュアル</dt>
              <dd>このマニュアルは、ここからいつでも確認できます。</dd>
              <dt>
                <svg viewBox="0 0 1200 1227">
                  <path
                    d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z"
                    fill="currentColor"
                  />
                </svg>
              </dt>
              <dd>
                作者のX（Twitter）へのリンクです。なにかあればご連絡ください。
              </dd>
            </dl>
            <h2>データの操作</h2>
            <ul>
              <li>行番号をドラッグすることで、行の並び替えができます。</li>
              <li>
                <i-octicon-chevron-down-16 />
                アイコンがあるヘッダをクリックすると、ソートメニューが表示されます。
              </li>
              <li>
                各行を右クリック（タッチパネルでは長押し）すると、行を追加・複製・削除するメニューが表示されます。
              </li>
              <li>
                カテゴリー、ジャンルが複数ある場合はカンマ（,）区切りで入力します。
              </li>
            </ul>
            <h2>ショートカットキー</h2>
            <dl>
              <dt class="shortcut">{{ metaKey }} <span>+</span> ; (+)</dt>
              <dd>行を追加。フォーカスがある場合はその下に追加。</dd>
              <dt class="shortcut">{{ metaKey }} <span>+</span> -</dt>
              <dd>フォーカスがある行を削除。</dd>
              <dt class="shortcut">{{ metaKey }} <span>+</span> ↑→↓←</dt>
              <dd>セル移動。</dd>
            </dl>
            <button class="button-close"><i-octicon-x-24 /> 閉じる</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, useTemplateRef, nextTick } from "vue";
import { gtmTrackEvent } from "@/utils/gtm.ts";
import { isMac } from "@/utils/checkingHelper";

const dialog = useTemplateRef<HTMLDivElement>("dialog");
const active = ref<boolean>(false);
const metaKey = isMac() ? "⌘" : "Ctrl";

const open = () => {
  active.value = true;
  nextTick(() => {
    dialog.value?.scrollTo({ top: 0 });
  });
  gtmTrackEvent("manual_open");
};

const close = () => {
  active.value = false;
  gtmTrackEvent("manual_close");
};

defineExpose({
  open,
});
</script>
