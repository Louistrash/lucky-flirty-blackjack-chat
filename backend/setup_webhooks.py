#!/usr/bin/env python3
"""
Script om Stripe webhooks in te stellen voor adultsplaystore.com
"""

import stripe
import json
import os

# Set your secret key. Remember to switch to your live secret key in production.
# See your keys here: https://dashboard.stripe.com/apikeys
stripe.api_key = os.getenv("STRIPE_API_KEY")

def create_webhook_endpoint():
    """Maak webhook endpoint aan voor adultsplaystore.com"""
    
    webhook_url = "https://www.adultsplaystore.com/api/webhooks/stripe"
    
    # Events die we willen ontvangen
    events = [
        'checkout.session.completed',
        'payment_intent.succeeded', 
        'payment_intent.payment_failed',
        'invoice.payment_succeeded',
        'invoice.payment_failed',
        'customer.subscription.created',
        'customer.subscription.updated',
        'customer.subscription.deleted',
        'customer.subscription.trial_will_end'
    ]
    
    try:
        # Maak webhook endpoint aan
        webhook_endpoint = stripe.WebhookEndpoint.create(
            url=webhook_url,
            enabled_events=events,
            description="Lucky Flirty Chat - Adultsplaystore.com webhook"
        )
        
        print("✅ Webhook endpoint succesvol aangemaakt!")
        print(f"📍 URL: {webhook_endpoint.url}")
        print(f"🔑 Webhook Secret: {webhook_endpoint.secret}")
        print(f"📋 ID: {webhook_endpoint.id}")
        
        print(f"\n🎯 Gebeurtenissen die worden gevolgd:")
        for event in events:
            print(f"   • {event}")
        
        print(f"\n⚙️  Voeg deze webhook secret toe aan je environment variabelen:")
        print(f"STRIPE_WEBHOOK_SECRET={webhook_endpoint.secret}")
        
        return webhook_endpoint
        
    except Exception as e:
        print(f"❌ Fout bij aanmaken webhook: {e}")
        return None

def list_existing_webhooks():
    """Toon bestaande webhooks"""
    
    print("🔍 Bestaande webhook endpoints:")
    print("-" * 50)
    
    try:
        webhooks = stripe.WebhookEndpoint.list()
        
        if len(webhooks.data) == 0:
            print("   Geen webhooks gevonden")
        else:
            for webhook in webhooks.data:
                print(f"✅ {webhook.url}")
                print(f"   ID: {webhook.id}")
                print(f"   Status: {'🟢 Actief' if webhook.status == 'enabled' else '🔴 Inactief'}")
                print(f"   Events: {len(webhook.enabled_events)} gebeurtenissen")
                print("")
                
    except Exception as e:
        print(f"❌ Fout bij ophalen webhooks: {e}")

def main():
    """Hoofdfunctie"""
    print("🚀 STRIPE WEBHOOK SETUP")
    print("=" * 50)
    
    # Toon bestaande webhooks
    list_existing_webhooks()
    
    print("\n🔧 Nieuwe webhook aanmaken...")
    webhook = create_webhook_endpoint()
    
    if webhook:
        print("\n" + "=" * 50)
        print("✅ WEBHOOK SETUP VOLTOOID!")
        print("\n📝 VOLGENDE STAPPEN:")
        print("1. Voeg de webhook secret toe aan je .env bestand")
        print("2. Implementeer de webhook handler in je backend")
        print("3. Test de webhook met Stripe CLI of test events")
        print("\n🔗 Nuttige links:")
        print("   • Stripe Dashboard Webhooks: https://dashboard.stripe.com/webhooks")
        print("   • Webhook Testing: https://stripe.com/docs/webhooks/test")

if __name__ == "__main__":
    main() 