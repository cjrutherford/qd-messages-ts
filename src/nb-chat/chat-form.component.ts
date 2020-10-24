/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  Output,
  OnInit
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { QuestOSService } from '../../../qD/src/app/services/quest-os.service';
import { NbComponentStatus } from '@nebular/theme';

/**
 * Chat form component.
 *
 * Show a message form with a send message button.
 *
 * ```ts
 * <nb-chat-form showButton="true" buttonIcon="nb-send">
 * </nb-chat-form>
 * ```
 *
 * When `[dropFiles]="true"` handles files drag&drop with a file preview.
 *
 * Drag & drop available for files and images:
 * @stacked-example(Drag & Drop Chat, chat/chat-drop.component)
 *
 * New message could be tracked outside by using `(send)` output.
 *
 * ```ts
 * <nb-chat-form (send)="onNewMessage($event)">
 * </nb-chat-form>
 *
 * // ...
 *
 * onNewMessage({ message: string, files: any[] }) {
 *   this.service.sendToServer(message, files);
 * }
 * ```
 */
@Component({
  selector: 'nb-chat-form',
  styleUrls: ['./chat-form.component.scss'],
  template: `
    <div class="dropped-files" *ngIf="droppedFiles?.length">
      <ng-container *ngFor="let file of droppedFiles">
        <div *ngIf="file.urlStyle" [style.background-image]="file.urlStyle">
          <span class="remove" (click)="removeFile(file)">&times;</span>
        </div>

        <div>
          <nb-icon *ngIf="!file.urlStyle" icon="file-text-outline" pack="nebular-essentials"></nb-icon>
          <span class="remove" (click)="removeFile(file)">&times;</span>
        </div>
      </ng-container>
    </div>
    <div class="message-row">
    <nb-form-field style="    width: 100%;">

      <input [(ngModel)]='newMessage' nbInput
             fullWidth
             [status]="getInputStatus()"
             (focus)="inputFocus = true"
             (blur)="inputFocus = false"
             (mouseenter)="inputHover = true"
             (mouseleave)="inputHover = false"
             [(ngModel)]="message"
             [class.with-button]="showButton"
             type="text"
             placeholder="{{ fileOver ? 'Drop file to send' : 'Type a message' }}"
             (keyup.enter)="sendMessage()"
             [mention]="peopleToMention"
             >
      <button  nbSuffix nbButton ghost
              [status]="status || 'primary'"

              (click)="sendMessage()"
          >
        <nb-icon *ngIf="!buttonTitle; else title" [icon]="buttonIcon" pack="nebular-essentials"></nb-icon>
        <ng-template #title>{{ buttonTitle }}</ng-template>
      </button>
      </nb-form-field>

    </div>


    <emoji-mart title="Pick your emoji…" (emojiClick)="addEmoji($event)" emoji="blush" class="emojiPicker" darkMode="true" style="position: absolute;  bottom: 30px;  right: 80px;" *ngIf="emojiPickerActive"></emoji-mart>
    <ngx-emoji emoji="grinning" set="apple" size="26" class="emojiPickerTrigger" (click)="openEmojiPicker()"></ngx-emoji>


  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NbChatFormComponent {

  peopleToMention = [];
  newMessage = "";

  @Input() channel: string;
  async ngOnInit(){
    // console.log('qD Messages: Channel: Chat: Chat-Form: Channel:',this.channel)
    //get mentionable participants from channel - do this every 120 seconds at least!
    console.log(this.channel);
    console.log(await this.q.os.social.getMentionItems(this.channel));
    this.peopleToMention = await this.q.os.social.getMentionItems(this.channel);
  }


  constructor(private q: QuestOSService, protected cd: ChangeDetectorRef, protected domSanitizer: DomSanitizer) {

  }


  addEmoji($event){
    // let data = this.emojiForm.get('inputField');
    // data.patchValue(data.value + $event.emoji.native)

    this.newMessage +=  ' ' + $event.emoji.colons + ' ';
    this.emojiPickerActive = false;
  }
  emojiPickerActive = false;
  openEmojiPicker(){
    this.emojiPickerActive = true;
  }


  status: NbComponentStatus | '' = '';
  inputFocus: boolean = false;
  inputHover: boolean = false;

  droppedFiles: any[] = [];
  imgDropTypes = ['image/png', 'image/jpeg', 'image/gif'];

  /**
   * Predefined message text
   * @type {string}
   */
  @Input() message: string = '';

  /**
   * Send button title
   * @type {string}
   */
  @Input() buttonTitle: string = '';

  /**
   * Send button icon, shown if `buttonTitle` is empty
   * @type {string}
   */
  @Input() buttonIcon: string = 'paper-plane-outline';

  /**
   * Show send button
   * @type {boolean}
   */
  @Input() showButton: boolean = true;

  /**
   * Show send button
   * @type {boolean}
   */
  @Input() dropFiles: boolean = false;

  /**
   *
   * @type {EventEmitter<{ message: string, files: File[] }>}
   */
  @Output() send = new EventEmitter<{ message: string, files: File[] }>();

  @HostBinding('class.file-over') fileOver = false;



  @HostListener('drop', ['$event'])
  onDrop(event: any) {
    if (this.dropFiles) {
      event.preventDefault();
      event.stopPropagation();

      this.fileOver = false;
      if (event.dataTransfer && event.dataTransfer.files) {

        for (const file of event.dataTransfer.files) {
          const res = file;

          if (this.imgDropTypes.includes(file.type)) {
            const fr = new FileReader();
            fr.onload = (e: any) => {
              res.src = e.target.result;
              res.urlStyle = this.domSanitizer.bypassSecurityTrustStyle(`url(${res.src})`);
              this.cd.detectChanges();
            };

            fr.readAsDataURL(file);
          }
          this.droppedFiles.push(res);
        }
      }
    }
  }

  removeFile(file) {
    const index = this.droppedFiles.indexOf(file);
    if (index >= 0) {
      this.droppedFiles.splice(index, 1);
    }
  }

  @HostListener('dragover')
  onDragOver() {
    if (this.dropFiles) {
      this.fileOver = true;
    }
  }

  @HostListener('dragleave')
  onDragLeave() {
    if (this.dropFiles) {
      this.fileOver = false;
    }
  }

  sendMessage() {
    if (this.droppedFiles.length || String(this.newMessage).trim().length) {

      this.send.emit({ message: this.newMessage, files: this.droppedFiles });
      this.message = '';
      this.newMessage = '';
      this.droppedFiles = [];
    }
  }

  setStatus(status: NbComponentStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.cd.detectChanges();
    }
  }

  getInputStatus(): NbComponentStatus | '' {
    if (this.fileOver) {
      return this.status || 'primary';
    }

    if (this.inputFocus || this.inputHover) {
      return this.status;
    }

    return '';
  }
}
