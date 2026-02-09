<?php

namespace App\Mail;

use App\Models\Customer;
use App\Models\Setting;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class CustomerWelcomeMail extends Mailable
{
    use Queueable, SerializesModels;

    public Customer $customer;
    public string $storeName;
    public string $storeUrl;
    public ?string $logoUrl;

    public function __construct(Customer $customer)
    {
        $this->customer = $customer;

        $settings = Setting::query()
            ->whereIn('key', ['store_name', 'logo'])
            ->pluck('value', 'key');

        $this->storeName = (string) ($settings['store_name'] ?? config('app.name', 'Magaza'));
        $this->logoUrl = $settings['logo'] ?? null;
        $this->storeUrl = rtrim((string) config('app.frontend_url', config('app.url')), '/');
    }

    public function build(): self
    {
        return $this->subject($this->storeName . ' - Hesabiniz olusturuldu')
            ->view('emails.customer-welcome');
    }
}
