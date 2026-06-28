import { Component, inject, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { EmotionService } from '../../services/emotion-service';
import { ChatService } from '../../services/chat.service';
import { NotificationService } from '../../services/notification.service';
import { Subscription, Observable } from 'rxjs';
import { ROLES } from '../../constants/app.constants';

@Component({
  selector: 'app-patient-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './patient-chat-component.html',
  styleUrls: ['./patient-chat-component.css']
})
export class PatientChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  sidebarOpen = false;
  profilePictureUrl: string | null = null;
  userInitial: string = 'P';
  currentUser: any;
  
  chats: any[] = [];
  activeChat: any = null;
  activeMessages: any[] = [];
  newMessage: string = '';
  isSending = false;
  
  unreadAlerts$: Observable<number>;
  private messagesSub?: Subscription;

  @ViewChild('scrollMe') private myScrollContainer?: ElementRef;

  private router = inject(Router);
  private authService = inject(AuthService);
  private chatService = inject(ChatService);
  private notificationService = inject(NotificationService);
  private emotionService = inject(EmotionService);
  public cdr = inject(ChangeDetectorRef);

  gamificationStatus: any = { PuntosGanados: 0 };

  constructor() {
    this.unreadAlerts$ = this.notificationService.unreadCount$;
  }

  ngOnInit() {
    this.currentUser = {
      id: this.authService.getUserId(),
      name: this.authService.getUserName(),
      role: this.authService.getUserRole(),
      profilePictureUrl: this.authService.getProfilePictureUrl()
    };
    if (!this.currentUser || !this.currentUser.role || !ROLES.PATIENT.includes(this.currentUser.role)) {
      this.router.navigate(['/login']);
      return;
    }
    
    this.userInitial = this.currentUser.name ? this.currentUser.name.charAt(0).toUpperCase() : 'P';
    this.profilePictureUrl = this.currentUser.profilePictureUrl || null;

    // Conectar WebSocket si no está conectado para notificaciones globales
    this.notificationService.connect(this.currentUser.id);
    
    // Cargar gamificación y chats
    this.loadGamificationStatus(this.currentUser.id);
    this.loadChats();

    // Suscribirse a mensajes entrantes
    this.messagesSub = this.chatService.messages$.subscribe(msg => {
      if (this.activeChat && msg.chatRoomId === this.activeChat.id) {
        this.activeMessages.push(msg);
        this.scrollToBottom();
      }
    });
  }

  ngOnDestroy() {
    if (this.messagesSub) {
      this.messagesSub.unsubscribe();
    }
    if (this.activeChat) {
      this.chatService.unsubscribeFromChat(this.activeChat.id);
    }
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  loadChats() {
    this.chatService.getMyChats(this.currentUser.id, 'ROLE_PATIENT').subscribe({
      next: (data) => {
        this.chats = data;
        if (this.chats.length > 0 && !this.activeChat) {
          this.selectChat(this.chats[0]);
        }
        console.log("Chats loaded successfully:", data);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error loading chats:", err);
      }
    });
  }

  selectChat(chat: any) {
    if (this.activeChat) {
      this.chatService.unsubscribeFromChat(this.activeChat.id);
    }
    this.activeChat = chat;
    this.activeMessages = [];
    this.cdr.detectChanges();
    
    // Cargar historial
    this.chatService.getChatHistory(chat.id).subscribe({
      next: (history) => {
        this.activeMessages = history;
        this.scrollToBottom();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error loading chat history:", err);
        this.cdr.detectChanges();
      }
    });

    // Suscribirse a nuevos mensajes
    this.chatService.subscribeToChat(chat.id);
  }

  getOtherUserName(chat: any): string {
    return chat.psychologist?.name || 'Psicólogo';
  }

  isMyMessage(msg: any): boolean {
    return msg.sender.id === this.currentUser.id;
  }

  sendMessage(event?: any) {
    if (event) {
      event.preventDefault(); // Evitar salto de línea con Enter
    }
    if (!this.newMessage.trim() || this.isSending || !this.activeChat) return;

    this.isSending = true;
    const dto = {
      content: this.newMessage.trim(),
      chat: { id: this.activeChat.id },
      sender: { id: this.currentUser.id }
    };

    this.chatService.sendMessage(dto).subscribe({
      next: (sent) => {
        this.newMessage = '';
        this.isSending = false;
        
        // Agregar el mensaje enviado a la lista inmediatamente
        const exists = this.activeMessages.find(m => m.id === sent.id);
        if (!exists) {
          this.activeMessages.push(sent);
        }
        
        this.scrollToBottom();
        this.cdr.detectChanges();
      },
      error: () => {
        this.isSending = false;
        this.cdr.detectChanges();
      }
    });
  }

  scrollToBottom(): void {
    try {
      if (this.myScrollContainer) {
        this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
      }
    } catch(err) { }
  }

  loadGamificationStatus(userId: number) {
    this.emotionService.getGamificationStatus(userId).subscribe({
      next: (data: any) => {
        this.gamificationStatus = data;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error cargando gamificación:', err);
        this.gamificationStatus = { PuntosGanados: 0 };
        this.cdr.detectChanges();
      }
    });
  }

  goTo(path: string) {
    this.router.navigate([path]);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

