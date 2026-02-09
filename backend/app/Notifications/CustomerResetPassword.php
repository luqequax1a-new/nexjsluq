<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Bus\Queueable;

class CustomerResetPassword extends Notification
{
    use Queueable;

    public string $token;

    public function __construct(string $token)
    {
        $this->token = $token;
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    protected function resetUrl(object $notifiable): string
    {
        $base = rtrim((string) config('app.frontend_url', config('app.url')), '/');
        $email = null;
        if (method_exists($notifiable, 'getAttribute')) {
            $email = $notifiable->getAttribute('email');
        }
        if (!$email && property_exists($notifiable, 'email')) {
            $email = $notifiable->email ?? null;
        }
        $suffix = $email ? ('?email=' . urlencode((string) $email)) : '';
        return $base . '/sifre-sifirla/' . $this->token . $suffix;
    }

    protected function displayName(object $notifiable): string
    {
        $first = '';
        $last = '';

        if (method_exists($notifiable, 'getAttribute')) {
            $first = (string) ($notifiable->getAttribute('first_name') ?? '');
            $last = (string) ($notifiable->getAttribute('last_name') ?? '');
        }

        if ($first === '' && property_exists($notifiable, 'first_name')) {
            $first = (string) ($notifiable->first_name ?? '');
        }
        if ($last === '' && property_exists($notifiable, 'last_name')) {
            $last = (string) ($notifiable->last_name ?? '');
        }
        $name = trim($first . ' ' . $last);

        if ($name !== '') {
            return $name;
        }

        $email = null;
        if (method_exists($notifiable, 'getAttribute')) {
            $email = $notifiable->getAttribute('email');
        }
        if (!$email && property_exists($notifiable, 'email')) {
            $email = $notifiable->email ?? null;
        }
        if ($email) {
            return (string) $email;
        }

        return 'Müşterimiz';
    }

    public function toMail(object $notifiable): MailMessage
    {
        $resetUrl = $this->resetUrl($notifiable);
        $expires = (int) config('auth.passwords.customers.expire', 60);

        return (new MailMessage)
            ->subject('Şifre Sıfırlama Talebi')
            ->view('emails.customer-reset-password', [
                'resetUrl' => $resetUrl,
                'name' => $this->displayName($notifiable),
                'expires' => $expires,
            ]);
    }
}
