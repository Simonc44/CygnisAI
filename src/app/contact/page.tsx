'use client';
import { useState } from 'react';
import { GenericPage } from "@/components/generic-page";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send } from "lucide-react";
import { getFirestore, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { app } from '@/lib/firebase-config';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function ContactPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const db = getFirestore(app);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const contactData = {
        name: formData.name,
        email: formData.email,
        message: formData.message,
        status: 'new',
        createdAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, 'contact_messages'), contactData);
      toast({
        title: "Message envoyé !",
        description: "Merci de nous avoir contactés. Nous reviendrons vers vous dès que possible.",
      });
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: 'contact_messages',
            operation: 'create',
            requestResourceData: contactData
        }));
    } finally {
        setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  return (
    <GenericPage
      title="Contactez-nous"
      description="Pour toute question, suggestion ou demande de partenariat, n'hésitez pas à nous laisser un message."
    >
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Votre nom</Label>
                <Input id="name" placeholder="Jean Dupont" required value={formData.name} onChange={handleChange} disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Votre email</Label>
                <Input id="email" type="email" placeholder="jean.dupont@exemple.com" required value={formData.email} onChange={handleChange} disabled={isLoading} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Votre message</Label>
              <Textarea id="message" placeholder="Écrivez votre message ici..." required className="min-h-[150px]" value={formData.message} onChange={handleChange} disabled={isLoading} />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading || !formData.name || !formData.email || !formData.message}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Envoyer le message
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </GenericPage>
  );
}
