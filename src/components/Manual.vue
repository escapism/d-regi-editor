<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-show="active" class="overlay" @click="close">
        <div
          class="manual-dialog"
          role="dialog"
          aria-modal="true"
          tabindex="-1"
        >
          <div class="dialog-content">
            <p><b>Dレジエディター</b>は「<a href="https://escapism.github.io/d-register/#/" target="_blank" style="font-weight: 700;">Dレジ</a>」の頒布物情報を編集するためのWebエディターです。<br>アプリ内でのデータ保存機能はありません。都度JSON/CSVファイルをインポート・エクスポートしてください。</p>
            <h2>操作方法</h2>
            <dl>
              <dt>JSONインポート</dt>
              <dd>
                「Dレジ」で書き出したJSONファイルをインポートします。設定画面で書き出したJSONの読み込みもできますが、編集できるのは頒布物情報だけです。
              </dd>
              <dt>JSONエクスポート</dt>
              <dd>
                編集した頒布物情報を書き出します。「Dレジ」の頒布物管理画面からインポートしてください。
              </dd>
              <dt>CSVインポート</dt>
              <dd>
                CSV形式のファイルをインポートします。
              </dd>
              <dt>CSVエクスポート</dt>
              <dd>
                編集した頒布物情報をCSV形式で書き出します。表計算ソフトで編集したい場合にご利用ください。<br><small>※「Dレジ」でのCSVインポートはできません。</small>
              </dd>
            </dl>
            <p>各行を右クリック（タッチパネルでは長押し）すると、行を追加・削除するメニューが表示されます。</p>
            <p>画面上部の <i-octicon-trash-24 /> をクリックすると削除モードになり、行の削除ができます。</p>
            <h2>ショートカットキー</h2>
            <dl>
              <dt>{{ metaKey }} + ; (+)</dt>
              <dd>
                行を追加。フォーカスがある場合はその下に追加。
              </dd>
              <dt>{{ metaKey }} + -</dt>
              <dd>
                フォーカスがある行を削除。
              </dd>
              <dt>{{ metaKey }} + ↑→↓←</dt>
              <dd>
                セル移動。
              </dd>
            </dl>
            <button class="button-close"><i-octicon-x-24 /> 閉じる</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { gtmTrackEvent } from "@/utils/gtm.ts";
import { isMac } from "@/utils/ChekingHelper";

const active = ref<boolean>(false);
  const metaKey = isMac() ? "⌘" : "Ctrl";

const open = () => {
  active.value = true;
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
